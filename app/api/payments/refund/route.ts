import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { paystack } from "@/lib/services/paystack"

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        const body = await request.json()
        const { transactionId, reference, amount, reason, initiatedBy } = body

        if (!transactionId && !reference) {
            return NextResponse.json(
                { error: "Transaction ID or reference required" },
                { status: 400 }
            )
        }

        // Get transaction
        let query = supabase
            .from("transactions")
            .select("*, krowba_links(seller_id), escrow_holds(*)")

        if (transactionId) {
            query = query.eq("id", transactionId)
        } else {
            query = query.eq("paystack_reference", reference)
        }

        const { data: transaction, error: txError } = await query.single()

        if (txError || !transaction) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
        }

        // Check if already refunded
        if (transaction.refund_status === "processed") {
            return NextResponse.json(
                { error: "Transaction already refunded" },
                { status: 400 }
            )
        }

        // Verify Paystack reference exists
        if (!transaction.paystack_reference) {
            return NextResponse.json(
                { error: "No Paystack reference found for this transaction" },
                { status: 400 }
            )
        }

        console.log(`[Refund API] Initiating refund for transaction ${transaction.id}`)

        // Initiate Paystack refund
        const refundResult = await paystack.initiateRefund({
            transaction: transaction.paystack_reference,
            amount: amount ? Math.round(amount * 100) : undefined, // Convert to kobo if provided
            reason: reason || "Krowba refund request",
        })

        if (!refundResult.success) {
            console.error("[Refund API] Paystack refund failed:", refundResult.error)
            return NextResponse.json({ error: refundResult.error || "Refund failed" }, { status: 500 })
        }

        console.log("[Refund API] Paystack refund initiated:", refundResult.data)

        // Store refund in database
        const refundAmount = amount || transaction.amount
        const { data: refund, error: refundError } = await supabase
            .from("refunds")
            .insert({
                transaction_id: transaction.id,
                escrow_hold_id: transaction.escrow_holds?.[0]?.id || null,
                paystack_refund_id: refundResult.data?.id,
                refund_reference: refundResult.data?.refund_reference || `REF-${Date.now()}`,
                amount: refundAmount,
                currency: transaction.currency || "KES",
                status: refundResult.data?.status || "pending",
                reason: reason || "Krowba refund request",
                logs: [
                    {
                        event: "initiated",
                        initiatedBy: initiatedBy || "system",
                        data: refundResult.data,
                        timestamp: new Date().toISOString(),
                    },
                ],
            })
            .select()
            .single()

        if (refundError) {
            console.error("[Refund API] Failed to save refund:", refundError)
            return NextResponse.json(
                { error: "Refund initiated but failed to save" },
                { status: 500 }
            )
        }

        // Update transaction with refund info
        const { error: updateError } = await supabase
            .from("transactions")
            .update({
                refund_id: refundResult.data?.id?.toString(),
                refund_reference: refund.refund_reference,
                refund_status: "pending",
                refund_amount: refundAmount,
                refund_reason: reason,
                status: "refunding",
            })
            .eq("id", transaction.id)

        if (updateError) {
            console.error("[Refund API] Failed to update transaction:", updateError)
        }

        // If escrow exists and is held, mark it for refund
        if (transaction.escrow_holds?.[0]?.status === "held") {
            const { error: escrowError } = await supabase
                .from("escrow_holds")
                .update({
                    status: "refunding",
                    refunded_at: new Date().toISOString(),
                })
                .eq("id", transaction.escrow_holds[0].id)

            if (escrowError) {
                console.error("[Refund API] Failed to update escrow:", escrowError)
            }

            // Deduct from seller's pending balance
            await supabase.rpc("decrement_seller_pending_balance", {
                p_seller_id: transaction.krowba_links.seller_id,
                p_amount: refundAmount,
            })
        }

        console.log(`[Refund API] Refund ${refund.id} created successfully`)

        return NextResponse.json({
            success: true,
            data: {
                refund_id: refund.id,
                refund_reference: refund.refund_reference,
                amount: refund.amount,
                status: refund.status,
                message: "Refund initiated successfully. Funds will be returned within 3-5 business days.",
            },
        })
    } catch (error: any) {
        console.error("[Refund API] Unexpected error:", error)
        return NextResponse.json({ error: error.message || "Refund failed" }, { status: 500 })
    }
}
