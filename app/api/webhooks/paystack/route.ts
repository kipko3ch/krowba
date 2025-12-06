import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { paystack } from "@/lib/services/paystack"

// Use service role for webhook operations (bypasses RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    const { reference, amount, customer, metadata, authorization } = data

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

    // Update transaction to HELD (not released!)
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
        status: "held", // CRITICAL: Not released until AI verification
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

    // Find escrow by transfer reference
    const { data: escrow } = await supabaseAdmin
        .from("escrow_holds")
        .select("*")
        .eq("transfer_reference", reference)
        .single()

    if (!escrow) {
        console.error("[Paystack Webhook] Escrow not found for transfer:", reference)
        return
    }

    // Update escrow to released
    await supabaseAdmin
        .from("escrow_holds")
        .update({
            status: "released",
            released_at: new Date().toISOString(),
            transfer_code: transfer_code,
        })
        .eq("id", escrow.id)

    // Update link status
    await supabaseAdmin
        .from("krowba_links")
        .update({ status: "completed" })
        .eq("id", escrow.krowba_link_id)

    console.log(`[Paystack Webhook] Transfer successful: ${escrow.amount} KES released to seller`)
}

// Handle failed transfer
async function handleTransferFailed(data: PaystackEvent["data"]) {
    const { reference } = data

    const { data: escrow } = await supabaseAdmin
        .from("escrow_holds")
        .select("*")
        .eq("transfer_reference", reference)
        .single()

    if (!escrow) return

    // Mark as failed - will need manual retry
    await supabaseAdmin
        .from("escrow_holds")
        .update({
            status: "transfer_failed",
            updated_at: new Date().toISOString(),
        })
        .eq("id", escrow.id)

    console.error(`[Paystack Webhook] Transfer FAILED for escrow ${escrow.id}`)
}

// Handle refund processed
async function handleRefundProcessed(data: PaystackEvent["data"]) {
    const { reference } = data

    // Find transaction by reference
    const { data: transaction } = await supabaseAdmin
        .from("transactions")
        .select("*, escrow_holds(*)")
        .eq("paystack_reference", reference)
        .single()

    if (!transaction) {
        console.error("[Paystack Webhook] Transaction not found for refund:", reference)
        return
    }

    // Update transaction status
    await supabaseAdmin
        .from("transactions")
        .update({ status: "refunded" })
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
        .eq("krowba_link_id", transaction.krowba_link_id)

    console.log(`[Paystack Webhook] Refund processed for transaction ${transaction.id}`)
}
