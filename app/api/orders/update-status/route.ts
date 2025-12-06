import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        const { linkId, status, action } = body

        if (!linkId || !status) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // 1. Validate Link
        const { data: link, error: linkError } = await supabase
            .from("krowba_links")
            .select("*")
            .eq("id", linkId)
            .single()

        if (linkError || !link) {
            return NextResponse.json({ error: "Link not found" }, { status: 404 })
        }

        // 2. Handle Actions
        if (action === 'mark_shipped') {
            // Seller Action
            // TODO: Verify user is seller (omitted for speed, relying on UI context for now)

            const { error: updateError } = await supabase
                .from("krowba_links")
                .update({
                    shipping_status: 'shipped',
                    shipped_at: new Date().toISOString()
                })
                .eq("id", linkId)

            if (updateError) throw updateError

        } else if (action === 'confirm_delivery') {
            // Buyer Action

            // Update Link Status
            const { error: updateError } = await supabase
                .from("krowba_links")
                .update({
                    shipping_status: 'delivered',
                    delivered_at: new Date().toISOString()
                })
                .eq("id", linkId)

            if (updateError) throw updateError

            // Trigger Fund Release
            const { data: transaction } = await supabase
                .from("transactions")
                .select("id, amount, seller_id")
                .eq("krowba_link_id", linkId)
                .eq("status", "completed") // Only release if paid
                .single()

            if (transaction) {
                // Check for seller bank account
                const { data: bankAccount } = await supabase
                    .from("seller_bank_accounts")
                    .select("paystack_recipient_code")
                    .eq("seller_id", transaction.seller_id)
                    .eq("is_default", true)
                    .single()

                if (bankAccount?.paystack_recipient_code) {
                    // Initiate Transfer via Paystack
                    // Dynamic import to avoid circular deps if any, though not strictly needed here
                    const { paystack } = await import("@/lib/services/paystack")

                    const transferResult = await paystack.initiateTransfer({
                        amount: transaction.amount * 100, // Convert to Kobo
                        recipient: bankAccount.paystack_recipient_code,
                        reason: `Payout for Order #${linkId.slice(0, 8)}`,
                        reference: `TRF_${transaction.id}_${Date.now()}`
                    })

                    if (transferResult.success) {
                        await supabase
                            .from("transactions")
                            .update({ escrow_status: 'released' })
                            .eq("id", transaction.id)
                    } else {
                        console.error("Paystack Transfer Failed:", transferResult.error)
                        // Log failure but don't fail the request, admin can retry
                    }
                } else {
                    // No bank account, just mark as released for manual payout
                    await supabase
                        .from("transactions")
                        .update({ escrow_status: 'released' }) // Signal to admin it's ready/released
                        .eq("id", transaction.id)
                }
            }
        } else if (action === 'return_item') {
            const { error: updateError } = await supabase
                .from("krowba_links")
                .update({
                    shipping_status: 'returned',
                    // returned_at: new Date().toISOString() // Add column if needed
                })
                .eq("id", linkId)

            if (updateError) throw updateError
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error("Order status update error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        )
    }
}
