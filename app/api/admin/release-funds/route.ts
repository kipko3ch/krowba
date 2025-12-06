import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // TODO: Add proper admin authentication check here
        // For now, we'll assume if they can hit this API they are authorized (DANGEROUS - FIX BEFORE PROD)
        // Ideally check for a specific user role or ID

        const { transaction_id } = await request.json()

        if (!transaction_id) {
            return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 })
        }

        // 1. Get transaction details
        const { data: transaction, error: txError } = await supabase
            .from("transactions")
            .select("*, krowba_links(seller_id)")
            .eq("id", transaction_id)
            .single()

        if (txError || !transaction) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
        }

        if (transaction.escrow_status === "released") {
            return NextResponse.json({ error: "Funds already released" }, { status: 400 })
        }

        // 2. Get seller's bank account (recipient code)
        // We need to fetch this from a 'seller_bank_accounts' table or similar
        // Assuming we have a way to get the recipient code. 
        // For this MVP, we might need to create a recipient first if not exists, but let's assume 
        // we have a `paystack_recipient_code` on the seller profile or a separate table.

        const { data: sellerBank } = await supabase
            .from("seller_bank_accounts")
            .select("recipient_code")
            .eq("seller_id", transaction.krowba_links.seller_id)
            .single()

        if (!sellerBank?.recipient_code) {
            return NextResponse.json({ error: "Seller bank account not configured" }, { status: 400 })
        }

        // 3. Initiate Transfer with Paystack
        const paystackSecret = process.env.PAYSTACK_SECRET_KEY

        const transferResponse = await fetch("https://api.paystack.co/transfer", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${paystackSecret}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                source: "balance",
                amount: transaction.amount * 100, // Paystack expects kobo/cents
                recipient: sellerBank.recipient_code,
                reason: `Payout for transaction ${transaction.short_code || transaction.id}`,
            }),
        })

        const transferData = await transferResponse.json()

        if (!transferData.status) {
            console.error("Paystack transfer error:", transferData)
            return NextResponse.json({ error: "Transfer failed: " + transferData.message }, { status: 500 })
        }

        // 4. Update Transaction Status
        const { error: updateError } = await supabase
            .from("transactions")
            .update({
                escrow_status: "released",
                payout_reference: transferData.data.reference,
                updated_at: new Date().toISOString()
            })
            .eq("id", transaction_id)

        if (updateError) {
            console.error("Failed to update transaction status:", updateError)
            // Note: Transfer succeeded but DB update failed. This is a critical state.
            return NextResponse.json({ error: "Transfer succeeded but DB update failed" }, { status: 500 })
        }

        return NextResponse.json({ success: true, data: transferData.data })

    } catch (error) {
        console.error("Release funds error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        )
    }
}
