import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { escrowService } from "@/lib/services/escrow"

// Use service role for refunds (may be initiated by system or admin)
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transaction_id, reason, admin_key } = body

    // Basic admin authentication (in production, use proper admin auth)
    const expectedKey = process.env.ADMIN_SECRET_KEY
    if (expectedKey && admin_key !== expectedKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!transaction_id || !reason) {
      return NextResponse.json({ error: "Transaction ID and reason required" }, { status: 400 })
    }

    const result = await escrowService.refundBuyer(transaction_id, reason)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      amount: result.amount,
    })
  } catch (error) {
    console.error("[Escrow Refund] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
