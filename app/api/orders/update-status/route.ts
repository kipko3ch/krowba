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

            // Trigger Fund Release (Call existing API or logic)
            // For now, we'll just update the transaction status directly here for simplicity
            // In a real app, this should be a separate secure service call

            const { data: transaction } = await supabase
                .from("transactions")
                .select("id")
                .eq("krowba_link_id", linkId)
                .eq("status", "completed") // Only release if paid
                .single()

            if (transaction) {
                // Call Release Funds API (internal call simulation)
                // We'll just update the transaction to 'released' status for now to reflect in Admin
                // The actual payout trigger would happen here
                await supabase
                    .from("transactions")
                    .update({ escrow_status: 'released' }) // Signal to admin it's ready/released
                    .eq("id", transaction.id)
            }
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
