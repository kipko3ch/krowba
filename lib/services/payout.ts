// Payout Service
// Handles Paystack transfer recipient creation and automatic payouts

import { createClient } from "@supabase/supabase-js"
import { paystack } from "./paystack"

const getSupabaseAdmin = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

interface PayoutSettings {
    account_type: "bank" | "mpesa"
    account_details: {
        bank_code?: string
        bank_name?: string
        account_number?: string
        phone_number?: string
    }
}

interface PayoutHistory {
    id: string
    amount: number
    currency: string
    status: "PENDING" | "SUCCESS" | "FAILED"
    transfer_reference: string | null
    created_at: string
    updated_at: string
}

export class PayoutService {
    /**
     * Create or update seller payout settings
     * Creates Paystack transfer recipient
     */
    async createOrUpdatePayoutSettings(sellerId: string, settings: PayoutSettings) {
        const supabase = getSupabaseAdmin()

        // Validate account type
        if (!["bank", "mpesa"].includes(settings.account_type)) {
            throw new Error("Invalid account type. Must be 'bank' or 'mpesa'")
        }

        // Create Paystack transfer recipient
        let recipientResult

        if (settings.account_type === "bank") {
            if (!settings.account_details.bank_code || !settings.account_details.account_number) {
                throw new Error("Bank code and account number are required")
            }

            recipientResult = await paystack.createTransferRecipient({
                type: "nuban",
                name: "Krowba Seller",
                account_number: settings.account_details.account_number,
                bank_code: settings.account_details.bank_code,
                currency: "KES",
            })
        } else {
            // M-Pesa
            if (!settings.account_details.phone_number) {
                throw new Error("Phone number is required for M-Pesa")
            }

            const formattedPhone = paystack.formatPhoneNumber(settings.account_details.phone_number)

            recipientResult = await paystack.createTransferRecipient({
                type: "mobile_money",
                name: "Krowba Seller",
                account_number: formattedPhone,
                bank_code: "mpesa", // Paystack code for M-Pesa
                currency: "KES",
            })
        }

        if (!recipientResult.success || !recipientResult.data) {
            throw new Error(recipientResult.error || "Failed to create transfer recipient")
        }

        // Save or update payout settings
        const { data: existing } = await supabase
            .from("seller_payout_settings")
            .select("id")
            .eq("seller_id", sellerId)
            .single()

        const payoutData = {
            seller_id: sellerId,
            recipient_code: recipientResult.data.recipient_code,
            account_type: settings.account_type,
            account_details: settings.account_details,
            is_verified: true,
            updated_at: new Date().toISOString(),
        }

        if (existing) {
            // Update existing
            const { error } = await supabase
                .from("seller_payout_settings")
                .update(payoutData)
                .eq("seller_id", sellerId)

            if (error) throw new Error(`Failed to update payout settings: ${error.message}`)
        } else {
            // Create new
            const { error } = await supabase
                .from("seller_payout_settings")
                .insert(payoutData)

            if (error) throw new Error(`Failed to create payout settings: ${error.message}`)
        }

        console.log(`[Payout] Settings saved for seller ${sellerId}`)
        return recipientResult.data
    }

    /**
     * Get seller payout settings
     */
    async getPayoutSettings(sellerId: string) {
        const supabase = getSupabaseAdmin()

        const { data, error } = await supabase
            .from("seller_payout_settings")
            .select("*")
            .eq("seller_id", sellerId)
            .single()

        if (error && error.code !== "PGRST116") {
            throw new Error(`Failed to fetch payout settings: ${error.message}`)
        }

        return data || null
    }

    /**
     * Initiate automatic payout after escrow release
     */
    async initiateAutoPayout(escrowId: string) {
        const supabase = getSupabaseAdmin()

        // Get escrow details
        const { data: escrow, error: escrowError } = await supabase
            .from("escrow_holds")
            .select("*")
            .eq("id", escrowId)
            .single()

        if (escrowError || !escrow) {
            throw new Error(`Escrow not found: ${escrowId}`)
        }

        // Get seller payout settings
        const payoutSettings = await this.getPayoutSettings(escrow.seller_id)

        if (!payoutSettings || !payoutSettings.is_verified) {
            throw new Error(`Seller ${escrow.seller_id} has no verified payout settings`)
        }

        // Generate unique transfer reference
        const transferReference = `PAYOUT_${escrowId}_${Date.now()}`

        // Create payout record
        const { data: payout, error: payoutError } = await supabase
            .from("payouts")
            .insert({
                seller_id: escrow.seller_id,
                escrow_hold_id: escrowId,
                amount: escrow.amount,
                currency: "KES",
                transfer_reference: transferReference,
                status: "PENDING",
            })
            .select()
            .single()

        if (payoutError) {
            throw new Error(`Failed to create payout record: ${payoutError.message}`)
        }

        // Initiate Paystack transfer
        const transferResult = await paystack.initiateTransfer({
            amount: Math.round(escrow.amount * 100), // Convert to kobo
            recipient: payoutSettings.recipient_code,
            reason: "Krowba Escrow Release",
            reference: transferReference,
        })

        if (!transferResult.success) {
            // Mark payout as failed
            await supabase
                .from("payouts")
                .update({
                    status: "FAILED",
                    paystack_response: { error: transferResult.error },
                    updated_at: new Date().toISOString(),
                })
                .eq("id", payout.id)

            throw new Error(`Transfer failed: ${transferResult.error}`)
        }

        // Update payout with transfer code
        await supabase
            .from("payouts")
            .update({
                transfer_code: transferResult.data?.transfer_code,
                paystack_response: transferResult.data,
                updated_at: new Date().toISOString(),
            })
            .eq("id", payout.id)

        // Update escrow with transfer details
        await supabase
            .from("escrow_holds")
            .update({
                transfer_reference: transferReference,
                transfer_code: transferResult.data?.transfer_code,
                payout_initiated_at: new Date().toISOString(),
            })
            .eq("id", escrowId)

        // Deduct from available balance (will be restored if transfer fails)
        await supabase.rpc("decrement_seller_available_balance", {
            p_seller_id: escrow.seller_id,
            p_amount: escrow.amount,
        })

        console.log(`[Payout] Initiated ${escrow.amount} KES transfer for seller ${escrow.seller_id}`)
        return payout
    }

    /**
     * Retry a failed payout
     */
    async retryFailedPayout(payoutId: string) {
        const supabase = getSupabaseAdmin()

        // Get payout details
        const { data: payout, error: payoutError } = await supabase
            .from("payouts")
            .select("*")
            .eq("id", payoutId)
            .single()

        if (payoutError || !payout) {
            throw new Error(`Payout not found: ${payoutId}`)
        }

        if (payout.status !== "FAILED") {
            throw new Error(`Cannot retry payout with status: ${payout.status}`)
        }

        // Get seller payout settings
        const payoutSettings = await this.getPayoutSettings(payout.seller_id)

        if (!payoutSettings) {
            throw new Error(`No payout settings for seller ${payout.seller_id}`)
        }

        // Generate new transfer reference
        const newReference = `${payout.transfer_reference}_RETRY_${Date.now()}`

        // Update payout status
        await supabase
            .from("payouts")
            .update({
                status: "PENDING",
                transfer_reference: newReference,
                retry_count: (payout.retry_count || 0) + 1,
                last_retry_at: new Date().toISOString(),
            })
            .eq("id", payoutId)

        // Initiate transfer
        const transferResult = await paystack.initiateTransfer({
            amount: Math.round(payout.amount * 100),
            recipient: payoutSettings.recipient_code,
            reason: "Krowba Payout Retry",
            reference: newReference,
        })

        if (!transferResult.success) {
            await supabase
                .from("payouts")
                .update({
                    status: "FAILED",
                    paystack_response: { error: transferResult.error },
                })
                .eq("id", payoutId)

            throw new Error(`Retry failed: ${transferResult.error}`)
        }

        // Update with new transfer code
        await supabase
            .from("payouts")
            .update({
                transfer_code: transferResult.data?.transfer_code,
                paystack_response: transferResult.data,
            })
            .eq("id", payoutId)

        console.log(`[Payout] Retried payout ${payoutId}`)
        return payout
    }

    /**
     * Get payout history for a seller
     */
    async getPayoutHistory(
        sellerId: string,
        options?: { page?: number; limit?: number }
    ): Promise<{ data: PayoutHistory[]; total: number }> {
        const supabase = getSupabaseAdmin()
        const page = options?.page || 1
        const limit = options?.limit || 20
        const offset = (page - 1) * limit

        // Get total count
        const { count } = await supabase
            .from("payouts")
            .select("*", { count: "exact", head: true })
            .eq("seller_id", sellerId)

        // Get paginated data
        const { data, error } = await supabase
            .from("payouts")
            .select("id, amount, currency, status, transfer_reference, created_at, updated_at")
            .eq("seller_id", sellerId)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1)

        if (error) {
            throw new Error(`Failed to fetch payout history: ${error.message}`)
        }

        return {
            data: data || [],
            total: count || 0,
        }
    }
}

export const payoutService = new PayoutService()
