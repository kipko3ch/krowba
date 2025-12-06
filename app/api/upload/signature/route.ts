import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { folder } = await request.json()

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || "krowba_unsigned"

    if (!cloudName || !apiKey || !apiSecret) {
      // Return mock response for development without Cloudinary
      return NextResponse.json({
        signature: "mock_signature",
        timestamp: Math.floor(Date.now() / 1000),
        cloudName: "demo",
        apiKey: "demo",
        uploadPreset: "ml_default",
      })
    }

    const timestamp = Math.floor(Date.now() / 1000)
    const paramsToSign = `folder=krowba/${folder}&timestamp=${timestamp}&upload_preset=${uploadPreset}`

    const signature = crypto
      .createHash("sha256")
      .update(paramsToSign + apiSecret)
      .digest("hex")

    return NextResponse.json({
      signature,
      timestamp,
      cloudName,
      apiKey,
      uploadPreset,
    })
  } catch (error) {
    console.error("Signature error:", error)
    return NextResponse.json({ error: "Failed to generate signature" }, { status: 500 })
  }
}
