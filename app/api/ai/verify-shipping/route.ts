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
        const { imageUrl } = body

        if (!imageUrl) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 })
        }

        // Use Google AI Studio Gemini API directly
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            return NextResponse.json({
                success: false,
                error: "AI service not configured"
            }, { status: 500 })
        }

        console.log("🔍 Verifying Shipping Proof:", imageUrl)

        // Fetch image and convert to base64
        let base64Image: string
        let mimeType: string = "image/jpeg"

        try {
            const imageResponse = await fetch(imageUrl)
            if (!imageResponse.ok) {
                throw new Error(`Failed to fetch image: ${imageResponse.status}`)
            }
            const contentType = imageResponse.headers.get("content-type")
            if (contentType) mimeType = contentType

            const arrayBuffer = await imageResponse.arrayBuffer()
            base64Image = Buffer.from(arrayBuffer).toString("base64")
        } catch (fetchError: any) {
            console.error("❌ Failed to fetch image:", fetchError)
            return NextResponse.json({
                success: false,
                error: "Failed to process image"
            }, { status: 500 })
        }

        const prompt = `You are a strict verification agent for an escrow platform.
    
Analyze this image to determine if it is a VALID SHIPPING PROOF.
Valid proofs include:
1. A courier receipt or waybill (e.g., DHL, FedEx, G4S, Wells Fargo, Local Courier).
2. A package with a visible shipping label containing tracking details.
3. A screenshot of a digital delivery confirmation.

INVALID images include:
- Random objects (people, animals, furniture).
- Selfies.
- Blurry or unreadable images.
- Product photos without packaging/labels.

Return JSON:
{
  "isValid": boolean,
  "confidence": 1-10,
  "reason": "Short explanation of why it is valid or invalid",
  "extractedDetails": {
    "courier": "Name if visible" or null,
    "trackingNumber": "Number if visible" or null
  }
}

BE STRICT. If you are unsure, mark as invalid or low confidence.`

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: prompt },
                                {
                                    inline_data: {
                                        mime_type: mimeType,
                                        data: base64Image
                                    }
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.1, // Low temperature for strictness
                        maxOutputTokens: 512,
                        responseMimeType: "application/json"
                    }
                })
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error?.message || "AI API failed")
            }

            const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text
            if (!responseText) throw new Error("No response from AI")

            const analysisData = JSON.parse(responseText)
            console.log("✅ Verification Result:", analysisData)

            return NextResponse.json({
                success: true,
                data: analysisData
            })

        } catch (aiError: any) {
            console.error("❌ AI Verification Error:", aiError)
            return NextResponse.json({
                success: false,
                error: "AI verification failed"
            }, { status: 500 })
        }

    } catch (error: any) {
        console.error("❌ Server Error:", error)
        return NextResponse.json(
            { success: false, error: error.message || "Internal server error" },
            { status: 500 }
        )
    }
}
