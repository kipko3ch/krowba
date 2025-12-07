// Escrow Service
// Handles escrow locking, release, and refund operations

import { createClient } from "@supabase/supabase-js"
import { paystack } from "./paystack"

const getSupabaseAdmin = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

interface EscrowSummary {
    pending_escrow_balance: number
    available_balance: number
    total_paid_out: number
}

export class EscrowService {
    /**
     * Lock escrow after successful payment
     * Updates seller's pending_escrow_balance
     */
    async lockEscrow(transactionId: string) {
        const supabase = getSupabaseAdmin()

        // Get transaction details
        const { data: transaction, error: txError } = await supabase
            .from("transactions")
            .select("*, escrow_holds(*)")
            .eq("id", transactionId)
            .single()

        if (txError || !transaction) {
            throw new Error(`Transaction not found: ${transactionId}`)
        }

        // Check if escrow already exists
        if (transaction.escrow_holds && transaction.escrow_holds.length > 0) {
            console.log(`[Escrow] Escrow already locked for transaction ${transactionId}`)
            return transaction.escrow_holds[0]
        }

        // Create escrow hold
        const { data: escrow, error: escrowError } = await supabase
            .from("escrow_holds")
            .insert({
                transaction_id: transactionId,
                krowba_link_id: transaction.krowba_link_id,
                seller_id: transaction.seller_id,
                amount: transaction.amount,
                currency: "KES",
                status: "held",
            })
            .select()
            .single()

        if (escrowError) {
            throw new Error(`Failed to create escrow: ${escrowError.message}`)
        }

        // Update seller pending balance
        await supabase.rpc("increment_seller_pending_balance", {
            p_seller_id: transaction.seller_id,
            p_amount: transaction.amount,
        })

        console.log(`[Escrow] Locked ${transaction.amount} KES for seller ${transaction.seller_id}`)
        return escrow
    }

    /**
     * Release escrow after delivery confirmation
     * Moves funds from pending to available balance
     * Initiates automatic payout
     */
    async releaseEscrow(escrowId: string) {
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

        if (escrow.status !== "held") {
            throw new Error(`Escrow already ${escrow.status}`)
        }

        // Move funds from pending to available
        await supabase.rpc("move_pending_to_available", {
            p_seller_id: escrow.seller_id,
            p_amount: escrow.amount,
        })

        // Mark escrow as released
        await supabase
            .from("escrow_holds")
            .update({
                status: "released",
                released_at: new Date().toISOString(),
            })
            .eq("id", escrowId)

        console.log(`[Escrow] Released ${escrow.amount} KES for seller ${escrow.seller_id}`)

        // Initiate automatic payout
        const { PayoutService } = await import("./payout")
        const payoutService = new PayoutService()
        await payoutService.initiateAutoPayout(escrowId)

        return escrow
    }

    /**
     * Refund escrow (e.g., during dispute resolution)
     * Removes funds from seller's pending balance
     */
    async refundEscrow(escrowId: string, reason?: string) {
        const supabase = getSupabaseAdmin()

        // Get escrow details
        const { data: escrow, error: escrowError } = await supabase
            .from("escrow_holds")
            .select("*, transactions(*)")
            .eq("id", escrowId)
            .single()

        if (escrowError || !escrow) {
            throw new Error(`Escrow not found: ${escrowId}`)
        }

        if (escrow.status !== "held") {
            throw new Error(`Cannot refund escrow with status: ${escrow.status}`)
        }

        // Deduct from seller pending balance
        await supabase.rpc("decrement_seller_pending_balance", {
            p_seller_id: escrow.seller_id,
            p_amount: escrow.amount,
        })

        // Mark escrow as refunded
        await supabase
            .from("escrow_holds")
            .update({
                status: "refunded",
                refunded_at: new Date().toISOString(),
            })
            .eq("id", escrowId)

        // Initiate Paystack refund if payment reference exists
        if (escrow.transactions?.[0]?.paystack_reference) {
            const refundResult = await paystack.initiateRefund({
                transaction: escrow.transactions[0].paystack_reference,
                reason: reason || "Krowba Escrow Refund",
            })

            if (!refundResult.success) {
                console.error(`[Escrow] Paystack refund failed: ${refundResult.error}`)
            }
        }

        console.log(`[Escrow] Refunded ${escrow.amount} KES for seller ${escrow.seller_id}`)
        return escrow
    }

    /**
     * Get seller's escrow summary
     */
    async getSellerEscrowSummary(sellerId: string): Promise<EscrowSummary> {
        const supabase = getSupabaseAdmin()

        const { data: seller, error } = await supabase
            .from("sellers")
            .select("pending_escrow_balance, available_balance, total_paid_out")
            .eq("id", sellerId)
            .single()

        if (error || !seller) {
            throw new Error(`Seller not found: ${sellerId}`)
        }

        return {
            pending_escrow_balance: Number(seller.pending_escrow_balance) || 0,
            available_balance: Number(seller.available_balance) || 0,
            total_paid_out: Number(seller.total_paid_out) || 0,
        }
    }
}

export const escrowService = new EscrowService()
