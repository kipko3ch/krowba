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
    } = body

    if (!transaction_id || !krowba_link_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!dispatch_images || dispatch_images.length === 0) {
      return NextResponse.json({ error: "Please upload at least one dispatch proof image" }, { status: 400 })
    }

    console.log(`[Dispatch Proof] Uploading shipping proof for transaction ${transaction_id}`)

    // Create shipping proof record
    const { data: proof, error: proofError } = await supabase
      .from("shipping_proofs")
      .insert({
        krowba_link_id,
        transaction_id,
        courier_name,
        courier_contact,
        tracking_number,
        dispatch_images,
        dispatch_video,
      })
      .select()
      .single()

    if (proofError) {
      console.error("[Dispatch Proof] Failed to create shipping proof:", proofError)
      return NextResponse.json({ error: "Failed to save shipping proof" }, { status: 500 })
    }

    // Update link with shipping details
    const { error: linkError } = await supabase
      .from("krowba_links")
      .update({
        shipping_status: "shipped",
        shipping_courier: courier_name,
        tracking_number: tracking_number || null,
        shipping_proof_url: dispatch_images[0],
        dispatch_video_url: dispatch_video || null,
      })
      .eq("id", krowba_link_id)

    if (linkError) {
      console.error("[Dispatch Proof] Failed to update link:", linkError)
    }

    // Update transaction status to shipped
    const { error: txError } = await supabase
      .from("transactions")
      .update({
        status: "shipped",
      })
      .eq("id", transaction_id)

    if (txError) {
      console.error("[Dispatch Proof] Failed to update transaction:", txError)
    }

    console.log(`[Dispatch Proof] Shipping proof ${proof.id} saved successfully`)

    return NextResponse.json({
      success: true,
      data: {
        proof_id: proof.id,
        message: "Shipping proof submitted successfully",
      },
    })
  } catch (error: any) {
    console.error("[Dispatch Proof] Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
