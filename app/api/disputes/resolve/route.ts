import { type NextRequest, NextResponse } from "next/server"
import { escrowService } from "@/lib/services/escrow"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dispute_id, resolution, partial_amount, admin_key } = body

    // Basic admin authentication
    const expectedKey = process.env.ADMIN_SECRET_KEY
    if (expectedKey && admin_key !== expectedKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!dispute_id || !resolution) {
      return NextResponse.json({ error: "Dispute ID and resolution required" }, { status: 400 })
    }

    const validResolutions = ["refund_buyer", "pay_seller", "partial_refund"]
    if (!validResolutions.includes(resolution)) {
      return NextResponse.json({ error: "Invalid resolution type" }, { status: 400 })
    }

    const result = await escrowService.resolveDispute(dispute_id, resolution, partial_amount)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      amount: result.amount,
    })
  } catch (error) {
    console.error("[Dispute Resolve] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
