import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { payhero } from "@/lib/services/payhero"

// Use service role for webhook operations (bypasses RLS)
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get("x-payhero-signature") || ""

    // Verify webhook signature
    if (!payhero.verifyWebhookSignature(rawBody, signature)) {
      console.error("[Webhook] Invalid signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const payload = JSON.parse(rawBody)
    console.log("[Webhook] Received:", payload)

    const { external_reference, status, amount, phone_number, provider_reference } = payload

    if (!external_reference) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 })
    }

    // Find the transaction
    const { data: transaction, error: txError } = await supabaseAdmin
      .from("transactions")
      .select("*, krowba_links(*)")
      .eq("payment_reference", external_reference)
      .single()

    if (txError || !transaction) {
      console.error("[Webhook] Transaction not found:", external_reference)
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Map PayHero status to our status
    let newStatus: string
    switch (status) {
      case "SUCCESS":
        newStatus = "completed"
        break
      case "FAILED":
        newStatus = "failed"
        break
      default:
        newStatus = "pending"
    }

    // Update transaction
    await supabaseAdmin
      .from("transactions")
      .update({
        status: newStatus,
        payhero_reference: provider_reference || transaction.payhero_reference,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id)

    // If payment successful, create escrow hold and update link status
    if (newStatus === "completed") {
      // Create escrow hold
      await supabaseAdmin.from("escrow_holds").insert({
        transaction_id: transaction.id,
        krowba_link_id: transaction.krowba_link_id,
        seller_id: transaction.seller_id,
        amount: transaction.amount,
        currency: "KES",
        status: "held",
      })

      // Update link status to "paid"
      await supabaseAdmin.from("krowba_links").update({ status: "paid" }).eq("id", transaction.krowba_link_id)

      // Create delivery confirmation record for buyer
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
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Webhook] Error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
