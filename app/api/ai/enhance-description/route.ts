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
        const { current_description, item_name, extra_details } = body

        if (!current_description || !extra_details) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            return NextResponse.json({
                error: "AI service not configured"
            }, { status: 500 })
        }

        // Create a natural prompt for enhancement
        const detailsList = Object.entries(extra_details)
            .filter(([_, v]) => v)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ")

        const prompt = `You are a seller on social media (Instagram/Twitter/WhatsApp) updating a payment link description for a buyer.

Current description: "${current_description}"
Product: ${item_name}
Additional details provided: ${detailsList}

Rewrite the description in the FIRST PERSON to include these new details naturally.

TONE:
- Casual, direct, and personal (like a DM or caption)
- NOT "salesy" or "e-commerce" style
- Assume the buyer is already interested
- Example: "Also, just to confirm, it's the 128GB model in Blue..." or "Updated to mention it comes with the original box."

Return ONLY the enhanced description text, nothing else. Be natural and genuine.`

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
                                { text: prompt }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 512,
                    }
                })
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error?.message || `API failed with status ${response.status}`)
            }

            const enhancedText = result.candidates?.[0]?.content?.parts?.[0]?.text
            if (!enhancedText) {
                throw new Error("No response content from AI")
            }

            return NextResponse.json({
                enhanced_description: enhancedText.trim()
            })

        } catch (apiError: any) {
            console.error("❌ Gemini API Error:", apiError.message)
            return NextResponse.json({
                error: apiError.message || "AI enhancement failed"
            }, { status: 500 })
        }

    } catch (error: any) {
        console.error("❌ Enhancement Error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to enhance description" },
            { status: 500 }
        )
    }
}
