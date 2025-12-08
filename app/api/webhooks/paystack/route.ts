import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { paystack } from "@/lib/services/paystack"

// Lazy initialization to avoid build-time errors
const getSupabaseAdmin = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

// Paystack webhook events
type PaystackEvent = {
    event: string
    data: {
        id: number
        reference: string
        status: string
        amount: number
        currency: string
        customer: {
            email: string
            customer_code: string
            phone?: string
        }
        metadata?: Record<string, string>
        authorization?: {
            authorization_code: string
        }
        transfer_code?: string
        recipient?: {
            recipient_code: string
        }
    }
}

export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.text()
        const signature = request.headers.get("x-paystack-signature") || ""

        // Verify webhook signature
        if (!paystack.verifyWebhookSignature(rawBody, signature)) {
            console.error("[Paystack Webhook] Invalid signature")
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
        }

        const payload: PaystackEvent = JSON.parse(rawBody)
        console.log("[Paystack Webhook] Received:", payload.event, payload.data.reference)

        switch (payload.event) {
            case "charge.success":
                await handleChargeSuccess(payload.data)
                break

            case "transfer.success":
                await handleTransferSuccess(payload.data)
                break

            case "transfer.failed":
                await handleTransferFailed(payload.data)
                break

            case "refund.pending":
                await handleRefundPending(payload.data)
                break

            case "refund.processing":
                await handleRefundProcessing(payload.data)
                break

            case "refund.needs-attention":
                await handleRefundNeedsAttention(payload.data)
                break

            case "refund.failed":
                await handleRefundFailed(payload.data)
                break

            case "refund.processed":
                await handleRefundProcessed(payload.data)
                break

            default:
                console.log("[Paystack Webhook] Unhandled event:", payload.event)
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error("[Paystack Webhook] Error:", error)
        return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
    }
}

// Handle successful payment - CREATE ESCROW HOLD
async function handleChargeSuccess(data: PaystackEvent["data"]) {
    const { reference, amount, customer, authorization } = data
    const supabaseAdmin = getSupabaseAdmin()

    // Find the transaction by reference
    const { data: transaction, error: txError } = await supabaseAdmin
        .from("transactions")
        .select("*, krowba_links(*)")
        .eq("paystack_reference", reference)
        .single()

    if (txError || !transaction) {
        console.error("[Paystack Webhook] Transaction not found:", reference)
        return
    }

    // Update transaction to completed with Paystack details
    await supabaseAdmin
        .from("transactions")
        .update({
            status: "completed",
            paystack_auth_code: authorization?.authorization_code,
            paystack_customer_code: customer.customer_code,
            updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id)

    // Create escrow hold - funds are HELD until delivery verified
    await supabaseAdmin.from("escrow_holds").insert({
        transaction_id: transaction.id,
        krowba_link_id: transaction.krowba_link_id,
        seller_id: transaction.seller_id,
        amount: transaction.amount,
        currency: "KES",
        status: "held",
    })

    // Add to seller's pending escrow balance
    await supabaseAdmin.rpc("increment_seller_pending_balance", {
        p_seller_id: transaction.seller_id,
        p_amount: transaction.amount,
    })

    // Update link status to "paid"
    await supabaseAdmin
        .from("krowba_links")
        .update({ status: "paid" })
        .eq("id", transaction.krowba_link_id)

    // Create delivery confirmation record
    const confirmationCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    await supabaseAdmin.from("delivery_confirmations").insert({
        transaction_id: transaction.id,
        krowba_link_id: transaction.krowba_link_id,
        buyer_phone: transaction.buyer_phone,
        confirmation_code: confirmationCode,
        confirmed: false,
    })

    // Update seller stats
    await supabaseAdmin.rpc("increment_seller_transactions", {
        seller_id: transaction.seller_id,
    })

    console.log(`[Paystack Webhook] Payment HELD: ${amount / 100} KES for transaction ${transaction.id}`)

}

// Handle successful transfer (payout to seller)
async function handleTransferSuccess(data: PaystackEvent["data"]) {
    const { reference, transfer_code } = data
    const supabaseAdmin = getSupabaseAdmin()

    // Find payout by transfer reference
    const { data: payout } = await supabaseAdmin
        .from("payouts")
        .select("*, escrow_holds(*)")
        .eq("transfer_reference", reference)
        .single()

    if (!payout) {
        console.error("[Paystack Webhook] Payout not found for transfer:", reference)
        return
    }

    // Update payout to SUCCESS
    await supabaseAdmin
        .from("payouts")
        .update({
            status: "SUCCESS",
            transfer_code: transfer_code,
            updated_at: new Date().toISOString(),
        })
        .eq("id", payout.id)

    // Update escrow to released (if exists)
    if (payout.escrow_hold_id) {
        await supabaseAdmin
            .from("escrow_holds")
            .update({
                status: "released",
                released_at: new Date().toISOString(),
                transfer_code: transfer_code,
            })
            .eq("id", payout.escrow_hold_id)

        // Update link status to completed
        if (payout.escrow_holds?.[0]) {
            await supabaseAdmin
                .from("krowba_links")
                .update({ status: "completed" })
                .eq("id", payout.escrow_holds[0].krowba_link_id)
        }
    }

    // Increment seller's total paid out
    await supabaseAdmin.rpc("increment_seller_total_paid_out", {
        p_seller_id: payout.seller_id,
        p_amount: payout.amount,
    })

    console.log(`[Paystack Webhook] Transfer successful: ${payout.amount} KES paid to seller ${payout.seller_id}`)

}

// Handle failed transfer
async function handleTransferFailed(data: PaystackEvent["data"]) {
    const { reference } = data
    const supabaseAdmin = getSupabaseAdmin()

    // Find payout by transfer reference
    const { data: payout } = await supabaseAdmin
        .from("payouts")
        .select("*")
        .eq("transfer_reference", reference)
        .single()

    if (!payout) {
        console.error("[Paystack Webhook] Payout not found for failed transfer:", reference)
        return
    }

    // Mark payout as FAILED
    await supabaseAdmin
        .from("payouts")
        .update({
            status: "FAILED",
            updated_at: new Date().toISOString(),
        })
        .eq("id", payout.id)

    // Refund amount back to seller's available balance (for retry)
    await supabaseAdmin.rpc("increment_seller_available_balance", {
        p_seller_id: payout.seller_id,
        p_amount: payout.amount,
    })

    console.error(`[Paystack Webhook] Transfer FAILED for payout ${payout.id} - Amount refunded to available balance`)

}

// Handle refund pending
async function handleRefundPending(data: PaystackEvent["data"]) {
    const { reference } = data
    const supabaseAdmin = getSupabaseAdmin()

    // Update refund status in database
    const { data: refund } = await supabaseAdmin
        .from("refunds")
        .select("*")
        .eq("refund_reference", data.reference || reference)
        .single()

    if (refund) {
        await supabaseAdmin
            .from("refunds")
            .update({
                status: "pending",
                logs: [...(refund.logs as any[]), {
                    event: "refund.pending",
                    data: data,
                    timestamp: new Date().toISOString()
                }],
                updated_at: new Date().toISOString()
            })
            .eq("id", refund.id)

        // Update transaction
        await supabaseAdmin
            .from("transactions")
            .update({ refund_status: "pending" })
            .eq("id", refund.transaction_id)
    }

    console.log(`[Paystack Webhook] Refund pending for reference: ${reference}`)
}

// Handle refund processing
async function handleRefundProcessing(data: PaystackEvent["data"]) {
    const { reference } = data
    const supabaseAdmin = getSupabaseAdmin()

    const { data: refund } = await supabaseAdmin
        .from("refunds")
        .select("*")
        .eq("refund_reference", data.reference || reference)
        .single()

    if (refund) {
        await supabaseAdmin
            .from("refunds")
            .update({
                status: "processing",
                logs: [...(refund.logs as any[]), {
                    event: "refund.processing",
                    data: data,
                    timestamp: new Date().toISOString()
                }],
                updated_at: new Date().toISOString()
            })
            .eq("id", refund.id)

        await supabaseAdmin
            .from("transactions")
            .update({ refund_status: "processing" })
            .eq("id", refund.transaction_id)
    }

    console.log(`[Paystack Webhook] Refund processing for reference: ${reference}`)
}

// Handle refund needs attention
async function handleRefundNeedsAttention(data: PaystackEvent["data"]) {
    const { reference } = data
    const supabaseAdmin = getSupabaseAdmin()

    const { data: refund } = await supabaseAdmin
        .from("refunds")
        .select("*")
        .eq("refund_reference", data.reference || reference)
        .single()

    if (refund) {
        await supabaseAdmin
            .from("refunds")
            .update({
                status: "needs_attention",
                logs: [...(refund.logs as any[]), {
                    event: "refund.needs-attention",
                    data: data,
                    timestamp: new Date().toISOString()
                }],
                updated_at: new Date().toISOString()
            })
            .eq("id", refund.id)

        await supabaseAdmin
            .from("transactions")
            .update({ refund_status: "needs_attention" })
            .eq("id", refund.transaction_id)

        // TODO: Send notification to admin for manual review
        console.warn(`[Paystack Webhook] Refund NEEDS ATTENTION for reference: ${reference}`)
    }
}

// Handle refund failed
async function handleRefundFailed(data: PaystackEvent["data"]) {
    const { reference } = data
    const supabaseAdmin = getSupabaseAdmin()

    const { data: refund } = await supabaseAdmin
        .from("refunds")
        .select("*")
        .eq("refund_reference", data.reference || reference)
        .single()

    if (refund) {
        await supabaseAdmin
            .from("refunds")
            .update({
                status: "failed",
                logs: [...(refund.logs as any[]), {
                    event: "refund.failed",
                    data: data,
                    timestamp: new Date().toISOString()
                }],
                updated_at: new Date().toISOString()
            })
            .eq("id", refund.id)

        await supabaseAdmin
            .from("transactions")
            .update({ refund_status: "failed" })
            .eq("id", refund.transaction_id)

        console.error(`[Paystack Webhook] Refund FAILED for reference: ${reference}`)
    }
}

// Handle refund processed
async function handleRefundProcessed(data: PaystackEvent["data"]) {
    const { reference } = data
    const supabaseAdmin = getSupabaseAdmin()

    // Update refund record
    const { data: refund } = await supabaseAdmin
        .from("refunds")
        .select("*")
        .eq("refund_reference", data.reference || reference)
        .single()

    if (refund) {
        await supabaseAdmin
            .from("refunds")
            .update({
                status: "processed",
                processed_at: new Date().toISOString(),
                logs: [...(refund.logs as any[]), {
                    event: "refund.processed",
                    data: data,
                    timestamp: new Date().toISOString()
                }],
                updated_at: new Date().toISOString()
            })
            .eq("id", refund.id)

        // Find transaction
        const { data: transaction } = await supabaseAdmin
            .from("transactions")
            .select("*, escrow_holds(*)")
            .eq("id", refund.transaction_id)
            .single()

        if (!transaction) {
            console.error("[Paystack Webhook] Transaction not found for refund:", reference)
            return
        }

        // Update transaction status
        await supabaseAdmin
            .from("transactions")
            .update({
                status: "refunded",
                refund_status: "processed"
            })
            .eq("id", transaction.id)

        // Update escrow status
        if (transaction.escrow_holds?.[0]) {
            await supabaseAdmin
                .from("escrow_holds")
                .update({
                    status: "refunded",
                    refunded_at: new Date().toISOString(),
                })
                .eq("id", transaction.escrow_holds[0].id)
        }

        // Update link status
        await supabaseAdmin
            .from("krowba_links")
            .update({ status: "cancelled" })
            .eq("id", transaction.krowba_link_id)

        console.log(`[Paystack Webhook] Refund PROCESSED for transaction ${transaction.id}`)
    }
}
