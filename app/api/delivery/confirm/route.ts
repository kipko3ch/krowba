import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Lazy initialization to avoid build-time errors
const getSupabaseAdmin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const { confirmation_id, confirmation_code } = body

    if (!confirmation_id || !confirmation_code) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify the confirmation
    const { data: confirmation, error: confError } = await supabaseAdmin
      .from("delivery_confirmations")
      .select("*, transactions(*), krowba_links(*)")
      .eq("id", confirmation_id)
      .eq("confirmation_code", confirmation_code)
      .single()

    if (confError || !confirmation) {
      return NextResponse.json({ error: "Invalid confirmation" }, { status: 404 })
    }

    if (confirmation.confirmed) {
      return NextResponse.json({ error: "Already confirmed" }, { status: 400 })
    }

    // Update confirmation
    await supabaseAdmin
      .from("delivery_confirmations")
      .update({
        confirmed: true,
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", confirmation_id)

    // Release escrow funds
    await supabaseAdmin
      .from("escrow_holds")
      .update({
        status: "released",
        released_at: new Date().toISOString(),
      })
      .eq("transaction_id", confirmation.transaction_id)

    // Update link status to completed
    await supabaseAdmin.from("krowba_links").update({ status: "completed" }).eq("id", confirmation.krowba_link_id)

    // Increment seller success count
    await supabaseAdmin.rpc("increment_seller_success", {
      seller_id: confirmation.krowba_links.seller_id,
    })

    // Update seller verification score
    await supabaseAdmin.rpc("update_seller_verification_score", {
      seller_id: confirmation.krowba_links.seller_id,
    })

    return NextResponse.json({
      success: true,
      message: "Delivery confirmed and payment released",
    })
  } catch (error) {
    console.error("[Delivery Confirm] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
