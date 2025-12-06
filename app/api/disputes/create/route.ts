import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role for dispute creation
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transaction_id, krowba_link_id, reason, initiated_by, evidence_images } = body

    if (!transaction_id || !krowba_link_id || !reason || !initiated_by) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Fetch transaction to get seller_id
    const { data: transaction, error: txError } = await supabaseAdmin
      .from("transactions")
      .select("seller_id")
      .eq("id", transaction_id)
      .single()

    if (txError || !transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Create dispute
    const { data: dispute, error: disputeError } = await supabaseAdmin
      .from("disputes")
      .insert({
        transaction_id,
        krowba_link_id,
        seller_id: transaction.seller_id,
        initiated_by,
        reason,
        evidence_images: evidence_images || [],
        resolution: "pending",
      })
      .select()
      .single()

    if (disputeError) {
      console.error("[Dispute] Creation error:", disputeError)
      return NextResponse.json({ error: "Failed to create dispute" }, { status: 500 })
    }

    // Update escrow status to disputed
    await supabaseAdmin.from("escrow_holds").update({ status: "disputed" }).eq("transaction_id", transaction_id)

    // Update link status to disputed
    await supabaseAdmin.from("krowba_links").update({ status: "disputed" }).eq("id", krowba_link_id)

    return NextResponse.json({
      success: true,
      data: dispute,
    })
  } catch (error) {
    console.error("[Dispute] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
