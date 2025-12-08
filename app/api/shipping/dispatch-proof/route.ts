import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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
    const {
      transaction_id,
      krowba_link_id,
      courier_name,
      courier_contact,
      tracking_number,
      dispatch_images,
      dispatch_video,
      original_product_image,
    } = body

    if (!transaction_id || !krowba_link_id || !courier_name || !dispatch_images?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify the transaction belongs to this seller
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .select("id, seller_id, status")
      .eq("id", transaction_id)
      .single()

    if (txError || !transaction || transaction.seller_id !== user.id) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Create shipping proof
    const { data: shippingProof, error: proofError } = await supabase
      .from("shipping_proofs")
      .insert({
        transaction_id,
        krowba_link_id,
        seller_id: user.id,
        courier_name,
        courier_contact: courier_contact || null,
        tracking_number: tracking_number || null,
        dispatch_images,
        dispatch_video: dispatch_video || null,
        dispatched_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (proofError) {
      console.error("[Shipping] Error creating proof:", proofError)
      return NextResponse.json({ error: "Failed to create shipping proof" }, { status: 500 })
    }

    // Update transaction status to shipped
    await supabase.from("transactions").update({ status: "shipped" }).eq("id", transaction_id)

    return NextResponse.json({
      success: true,
      data: shippingProof,
    })
  } catch (error) {
    console.error("[Shipping] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


