import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { paystack } from "@/lib/services/paystack"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get("reference")

    if (!reference) {
      return NextResponse.json({ error: "Reference required" }, { status: 400 })
    }

    const supabase = await createClient()

    // First check our database
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .select("*, krowba_links(*)")
      .or(`paystack_reference.eq.${reference},payment_reference.eq.${reference}`)
      .single()

    if (txError || !transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // If already completed or failed, return current status
    if (transaction.status !== "pending") {
      return NextResponse.json({
        success: true,
        data: {
          status: transaction.status,
          amount: transaction.amount,
          reference: reference,
        },
      })
    }

    // Otherwise, verify with Paystack
    const verification = await paystack.verifyPayment(reference)

    if (verification.success && verification.data?.status === "success") {
      // Update transaction (webhook may have already done this)
      await supabase
        .from("transactions")
        .update({
          status: "completed",
          paystack_auth_code: verification.data.authorization?.authorization_code,
          paystack_customer_code: verification.data.customer.customer_code,
        })
        .eq("id", transaction.id)

      // Also mark the link as sold
      await supabase
        .from("krowba_links")
        .update({ status: "sold" })
        .eq("id", transaction.krowba_link_id)

      return NextResponse.json({
        success: true,
        data: {
          status: "completed",
          amount: transaction.amount,
          reference: reference,
        },
      })
    }

    return NextResponse.json({
      success: false,
      data: {
        status: verification.data?.status || "pending",
        reference: reference,
      },
    })
  } catch (error) {
    console.error("[Payment Status] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
