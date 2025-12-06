import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { aiService } from "@/lib/services/ai"

// Endpoint for comparing packaging photos to original product
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
    const { verification_type, packaging_url, product_url, shipping_proof_id, krowba_link_id } = body

    if (verification_type === "packaging_comparison") {
      if (!packaging_url || !product_url) {
        return NextResponse.json({ error: "Missing image URLs" }, { status: 400 })
      }

      const result = await aiService.comparePackagingToProduct(packaging_url, product_url)

      // Store verification result
      if (shipping_proof_id) {
        await supabase
          .from("shipping_proofs")
          .update({
            ai_comparison_score: result.score,
            ai_comparison_status: result.status,
          })
          .eq("id", shipping_proof_id)

        // Also store in ai_verifications
        await supabase.from("ai_verifications").insert({
          entity_type: "shipping_proof",
          entity_id: shipping_proof_id,
          verification_type: "similarity_check",
          image_url: packaging_url,
          score: result.score,
          confidence: result.confidence,
          status: result.status,
          message: result.message,
        })
      }

      return NextResponse.json({
        success: true,
        data: result,
      })
    }

    if (verification_type === "fake_detection") {
      const { image_url } = body
      if (!image_url) {
        return NextResponse.json({ error: "Missing image URL" }, { status: 400 })
      }

      const result = await aiService.detectFakeImage(image_url)

      return NextResponse.json({
        success: true,
        data: result,
      })
    }

    return NextResponse.json({ error: "Invalid verification type" }, { status: 400 })
  } catch (error) {
    console.error("[AI Verify] Error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
