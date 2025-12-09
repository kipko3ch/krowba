// Mock Wallet Service
// Manages seller virtual wallet with pending, available, refunded, and paid balances

import { createClient } from "@supabase/supabase-js"
import type { VirtualWallet, WalletTransaction } from "@/types"

const getSupabaseAdmin = () => {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

/**
 * Generate a random delay for simulating payout processing
 */
const randomDelay = (min: number, max: number): Promise<void> => {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min
    return new Promise((resolve) => setTimeout(resolve, delay))
}

export class MockWalletService {
    /**
     * Get seller's virtual wallet balances
     */
    async getWalletBalances(sellerId: string): Promise<VirtualWallet> {
        const supabase = getSupabaseAdmin()

        const { data: seller, error } = await supabase
            .from("sellers")
            .select("pending_escrow_balance, available_balance, total_paid_out")
            .eq("id", sellerId)
            .single()

        if (error || !seller) {
            throw new Error(`Seller not found: ${sellerId}`)
        }

        // Calculate refunded amount from escrow_holds
        const { data: refundedHolds } = await supabase
            .from("escrow_holds")
            .select("amount")
            .eq("seller_id", sellerId)
            .eq("status", "refunded")

        const refunded = refundedHolds?.reduce((sum, hold) => sum + Number(hold.amount), 0) || 0

        return {
            pending: Number(seller.pending_escrow_balance) || 0,
            available: Number(seller.available_balance) || 0,
            refunded: refunded,
            paid: Number(seller.total_paid_out) || 0,
        }
    }

    /**
     * Get seller's transaction history
     */
    async getTransactionHistory(sellerId: string, limit = 50): Promise<WalletTransaction[]> {
        const supabase = getSupabaseAdmin()

        const { data: transactions, error } = await supabase
            .from("transactions")
            .select(
                `
                id,
                amount,
                payment_reference,
                payment_method,
                status,
                created_at,
                escrow_holds(status)
            `
            )
            .eq("seller_id", sellerId)
            .order("created_at", { ascending: false })
            .limit(limit)

        if (error) {
            throw new Error(`Failed to fetch transaction history: ${error.message}`)
        }

        return (
            transactions?.map((t: any) => ({
                id: t.id,
                reference: t.payment_reference || "N/A",
                amount: Number(t.amount),
                type: this.mapStatusToWalletType(t.status, t.escrow_holds?.[0]?.status),
                status: t.status,
                payment_method: t.payment_method || "mobile",
                created_at: t.created_at,
            })) || []
        )
    }

    /**
     * Map transaction/escrow status to wallet balance type
     */
    private mapStatusToWalletType(txStatus: string, escrowStatus?: string): "pending" | "available" | "refunded" | "paid" {
        if (escrowStatus === "refunded") return "refunded"
        if (escrowStatus === "released") return "available"
        if (txStatus === "completed" && escrowStatus === "held") return "pending"
        if (txStatus === "refunded") return "refunded"
        return "pending"
    }

    /**
     * Simulate payout processing
     * Moves funds from available → paid
     */
    async simulatePayout(sellerId: string, amount?: number): Promise<{
        success: boolean
        reference: string
        amount: number
        message: string
    }> {
        const supabase = getSupabaseAdmin()

        // Get current available balance
        const { data: seller, error: sellerError } = await supabase
            .from("sellers")
            .select("available_balance")
            .eq("id", sellerId)
            .single()

        if (sellerError || !seller) {
            throw new Error("Seller not found")
        }

        const availableBalance = Number(seller.available_balance) || 0
        const payoutAmount = amount || availableBalance

        if (payoutAmount <= 0) {
            return {
                success: false,
                reference: "",
                amount: 0,
                message: "No funds available for payout",
            }
        }

        if (payoutAmount > availableBalance) {
            return {
                success: false,
                reference: "",
                amount: payoutAmount,
                message: `Insufficient balance. Available: KES ${availableBalance}`,
            }
        }

        // Simulate payout processing delay (1500ms - 2500ms)
        await randomDelay(1500, 2500)

        // Move funds from available to paid
        await supabase.rpc("move_available_to_paid", {
            p_seller_id: sellerId,
            p_amount: payoutAmount,
        })

        const reference = `PAYOUT_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`

        return {
            success: true,
            reference,
            amount: payoutAmount,
            message: `Payout of KES ${payoutAmount.toLocaleString()} processed successfully`,
        }
    }

    /**
     * Get payout history (simulated from total_paid_out changes)
     */
    async getPayoutHistory(sellerId: string): Promise<
        Array<{
            id: string
            amount: number
            reference: string
            status: string
            created_at: string
        }>
    > {
        // In a real implementation, this would query a payouts table
        // For now, we'll return mock data based on total_paid_out
        const supabase = getSupabaseAdmin()

        const { data: seller } = await supabase.from("sellers").select("total_paid_out").eq("id", sellerId).single()

        const totalPaidOut = Number(seller?.total_paid_out) || 0

        if (totalPaidOut === 0) {
            return []
        }

        // Return a mock payout record
        return [
            {
                id: "mock-payout-1",
                amount: totalPaidOut,
                reference: "PAYOUT_MOCK_XXXXX",
                status: "completed",
                created_at: new Date().toISOString(),
            },
        ]
    }
}

export const mockWalletService = new MockWalletService()
