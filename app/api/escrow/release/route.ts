import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { escrowService } from "@/lib/services/escrow"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { transaction_id } = body

    if (!transaction_id) {
      return NextResponse.json({ error: "Transaction ID required" }, { status: 400 })
    }

    // Verify the transaction belongs to this seller
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .select("seller_id")
      .eq("id", transaction_id)
      .single()

    if (txError || !transaction || transaction.seller_id !== user.id) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    const result = await escrowService.releaseFunds(transaction_id)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      amount: result.amount,
    })
  } catch (error) {
    console.error("[Escrow Release] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
