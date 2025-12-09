import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Lazy initialization to avoid build-time errors
const getSupabaseAdmin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { link_id, buyer_name, buyer_phone, buyer_email, amount, payment_method, card_number, card_expiry, card_cvv } = body

    if (!link_id || !buyer_email || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

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

    // Use MOCK payment system instead of Paystack
    const mockPaymentResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/mock/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payment_method: payment_method || "card",
        amount,
        krowba_link_id: link_id,
        seller_id: link.seller_id,
        buyer_phone,
        buyer_name,
        buyer_email,
        card_number,
        card_expiry,
        card_cvv,
      }),
    })

    const mockPaymentData = await mockPaymentResponse.json()

    if (!mockPaymentData.success) {
      return NextResponse.json({
        success: false,
        error: mockPaymentData.message || "Payment failed",
      }, { status: 400 })
    }

    // Mock payment succeeded - return success with transaction details
    return NextResponse.json({
      success: true,
      data: {
        transaction_id: mockPaymentData.transaction_id,
        reference: mockPaymentData.reference,
        status: mockPaymentData.status,
        message: mockPaymentData.message,
        // No authorization_url needed for mock payments
      },
    })
  } catch (error) {
    console.error("[Pay] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
