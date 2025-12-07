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
    const { images } = body

    if (!images || images.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 })
    }

    // Use Google AI Studio Gemini API directly
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("GEMINI_API_KEY not set")
      return NextResponse.json({
        success: false,
        error: "AI service not configured"
      }, { status: 500 })
    }

    const imageUrl = images[0]
    console.log("🔍 Analyzing Image:", imageUrl)

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
      console.log("✅ Image converted, size:", Math.round(base64Image.length / 1024), "KB")
    } catch (fetchError: any) {
      console.error("❌ Failed to fetch image:", fetchError)
      return NextResponse.json({
        success: false,
        error: "Failed to process image"
      }, { status: 500 })
    }

    const prompt = `You are a seller on social media (Instagram/Twitter/WhatsApp) creating a payment link for a buyer who has likely already seen your post or story.

Analyze this product image and generate a description in the FIRST PERSON.

TONE:
- Casual, direct, and personal (like a DM or caption)
- NOT "salesy" or "e-commerce" style
- Assume the buyer is already interested
- Example: "Here's the iPhone 12 we talked about. It's in great condition..." or "As seen on my story, this is the..."

Return JSON:
{
  "item_name": "Short, catchy name (e.g., 'Blue iPhone 12 - 128GB')",
  "condition": "New" | "Like New" | "Good" | "Fair" | "Poor",
  "description": "Write a short, casual note to the buyer. Mention key details (condition, defects) honestly but casually. Don't use bullet points or formal language. Keep it under 280 characters if possible.",
  "defects": ["visible defects"] or [],
  "suggested_price": {"min": number, "max": number},
  "confidence": 0.0-1.0,
  "missing_details": ["storage", "color", "size", "model variant", "year"] or []
}

IMPORTANT: 
- Sound like a REAL PERSON, not a bot.
- Be honest about condition.
- Use a friendly, social-media-native tone.

Prices in KES. Return ONLY valid JSON.`

    console.log("🚀 Sending to Gemini 2.0 Flash...")

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
            temperature: 0.2,
            maxOutputTokens: 1024,
          }
        })
      })

      const result = await response.json()
      console.log("📥 Gemini Response Status:", response.status)

      if (!response.ok) {
        console.error("❌ Gemini Error:", JSON.stringify(result, null, 2))
        throw new Error(result.error?.message || `API failed with status ${response.status}`)
      }

      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text
      if (!responseText) {
        console.error("❌ No text in response:", JSON.stringify(result, null, 2))
        throw new Error("No response content from AI")
      }

      console.log("📥 AI Response:", responseText.substring(0, 200))

      // Parse JSON from response
      let analysisData
      try {
        let cleanedContent = responseText
          .replace(/```json\s*/gi, "")
          .replace(/```\s*/gi, "")
          .trim()

        const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          cleanedContent = jsonMatch[0]
        }

        analysisData = JSON.parse(cleanedContent)
        console.log("✅ Parsed successfully:", analysisData.item_name)
      } catch (parseError) {
        console.error("❌ Failed to parse:", responseText)
        return NextResponse.json({
          success: false,
          error: "Failed to parse AI response"
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: analysisData
      })

    } catch (apiError: any) {
      console.error("❌ Gemini API Error:", apiError.message)

      // Fallback to Groq if Gemini fails (Rate limit or other error)
      const groqKey = process.env.GROQ_API_KEY
      if (groqKey) {
        console.log("⚠️ Switching to Groq fallback...")
        try {
          // Groq OpenAI-compatible endpoint
          const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${groqKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "meta-llama/llama-4-maverick-17b-128e-instruct", // User specified model
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: prompt },
                    {
                      type: "image_url",
                      image_url: {
                        url: `data:${mimeType};base64,${base64Image}`
                      }
                    }
                  ]
                }
              ],
              temperature: 0.2,
              max_tokens: 1024,
              response_format: { type: "json_object" } // Groq supports JSON mode
            })
          })

          if (!groqResponse.ok) {
            const err = await groqResponse.json()
            console.error("❌ Groq Error:", err)
            throw new Error(err.error?.message || "Groq API failed")
          }

          const groqResult = await groqResponse.json()
          const groqText = groqResult.choices[0]?.message?.content

          if (!groqText) throw new Error("No content from Groq")

          console.log("📥 Groq Response:", groqText.substring(0, 200))

          // Parse JSON from Groq response
          let analysisData
          try {
            let cleanedContent = groqText
              .replace(/```json\s*/gi, "")
              .replace(/```\s*/gi, "")
              .trim()

            const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              cleanedContent = jsonMatch[0]
            }
            analysisData = JSON.parse(cleanedContent)
          } catch (e) {
            console.error("❌ Failed to parse Groq JSON")
            throw e
          }

          return NextResponse.json({
            success: true,
            data: analysisData,
            source: "groq"
          })

        } catch (groqError: any) {
          console.error("❌ Groq Fallback Failed:", groqError.message)
          // Return original Gemini error if fallback also fails
          return NextResponse.json({
            success: false,
            error: apiError.message || "AI analysis failed (Gemini & Groq)"
          }, { status: 500 })
        }
      }

      return NextResponse.json({
        success: false,
        error: apiError.message || "AI analysis failed"
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error("❌ AI Analysis Error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to analyze item" },
      { status: 500 }
    )
  }
}
