import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { paystack } from "@/lib/services/paystack"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { link_id, buyer_name, buyer_phone, buyer_email, amount, payment_type } = body

    if (!link_id || !buyer_email || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch the Krowba link
    const { data: link, error: linkError } = await supabase
      .from("krowba_links")
      .select("*")
      .eq("id", link_id)
      .single()

    if (linkError || !link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 })
    }

    if (link.status !== "active") {
      return NextResponse.json({ error: "This link is no longer active" }, { status: 400 })
    }

    // Generate unique reference
    const paystackReference = `KRW_${link.short_code}_${Date.now()}`

    // Create transaction record FIRST
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        krowba_link_id: link_id,
        seller_id: link.seller_id,
        buyer_phone: buyer_phone ? paystack.formatPhoneNumber(buyer_phone) : null,
        buyer_name: buyer_name || null,
        amount,
        payment_type,
        payment_method: "paystack",
        payment_reference: paystackReference,
        paystack_reference: paystackReference,
        status: "pending",
      })
      .select()
      .single()

    if (txError) {
      console.error("[Pay] Transaction creation error:", txError)
      return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
    }

    // Callback URL after payment
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback?ref=${paystackReference}`

    // Initialize Paystack payment
    const paystackResult = await paystack.initializePayment({
      amount: amount * 100, // Convert to Kobo (cents)
      email: buyer_email,
      reference: paystackReference,
      callback_url: callbackUrl,
      metadata: {
        seller_id: link.seller_id,
        buyer_id: buyer_phone || buyer_email,
        item_id: link.id,
        krowba_transaction_id: transaction.id,
        payment_type: payment_type,
        item_name: link.item_name,
      },
      channels: ["card", "bank", "ussd", "mobile_money", "bank_transfer"],
    })

    if (!paystackResult.success || !paystackResult.data) {
      // Update transaction status to failed
      await supabase.from("transactions").update({ status: "failed" }).eq("id", transaction.id)

      return NextResponse.json({
        error: paystackResult.error || "Payment initiation failed"
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        transaction_id: transaction.id,
        reference: paystackResult.data.reference,
        authorization_url: paystackResult.data.authorization_url,
        access_code: paystackResult.data.access_code,
      },
    })
  } catch (error) {
    console.error("[Pay] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
