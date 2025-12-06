import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { aiService } from "@/lib/services/ai"

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
        ai_comparison_status: "pending",
        dispatched_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (proofError) {
      console.error("[Shipping] Error creating proof:", proofError)
      return NextResponse.json({ error: "Failed to create shipping proof" }, { status: 500 })
    }

    // Run AI comparison asynchronously if we have original image
    if (original_product_image && dispatch_images[0]) {
      // Don't await - run in background
      runAIComparison(shippingProof.id, dispatch_images[0], original_product_image)
    }

    return NextResponse.json({
      success: true,
      data: shippingProof,
    })
  } catch (error) {
    console.error("[Shipping] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function runAIComparison(shippingProofId: string, packagingUrl: string, productUrl: string) {
  try {
    const result = await aiService.comparePackagingToProduct(packagingUrl, productUrl)

    // Update using service role (we're in a background process)
    const { createClient } = await import("@supabase/supabase-js")
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    await supabaseAdmin
      .from("shipping_proofs")
      .update({
        ai_comparison_score: result.score,
        ai_comparison_status: result.status,
      })
      .eq("id", shippingProofId)

    // Store verification record
    await supabaseAdmin.from("ai_verifications").insert({
      entity_type: "shipping_proof",
      entity_id: shippingProofId,
      verification_type: "similarity_check",
      image_url: packagingUrl,
      score: result.score,
      confidence: result.confidence,
      status: result.status,
      message: result.message,
    })

    console.log(`[AI] Shipping proof ${shippingProofId} comparison: ${result.status}`)
  } catch (error) {
    console.error("[AI] Background comparison failed:", error)
  }
}
