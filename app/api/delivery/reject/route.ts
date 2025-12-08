import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        const body = await request.json()
        const { confirmation_id, transaction_id, reason, evidence_photos } = body

        if (!confirmation_id && !transaction_id) {
            return NextResponse.json({ error: "Confirmation ID or Transaction ID required" }, { status: 400 })
        }

        if (!reason || reason.trim() === "") {
            return NextResponse.json({ error: "Please describe the issue" }, { status: 400 })
        }

        let actualTransactionId = transaction_id

        // If confirmation_id provided, get the transaction_id from it
        if (confirmation_id) {
            const { data: confirmation, error: confError } = await supabase
                .from("delivery_confirmations")
                .select("transaction_id")
                .eq("id", confirmation_id)
                .single()

            if (confError || !confirmation) {
                return NextResponse.json({ error: "Confirmation not found" }, { status: 404 })
            }

            actualTransactionId = confirmation.transaction_id

            // Update delivery confirmation if it exists
            await supabase
                .from("delivery_confirmations")
                .update({
                    action_type: "reject",
                })
                .eq("id", confirmation_id)
        }

        // Create delivery evidence record
        const { data: evidence, error: evidenceError } = await supabase
            .from("delivery_evidence")
            .insert({
                transaction_id: actualTransactionId,
                delivery_confirmation_id: confirmation_id || null,
                evidence_type: "reject",
                description: reason,
                evidence_photos: evidence_photos || [],
            })
            .select()
            .single()

        if (evidenceError) {
            console.error("[Reject Delivery] Failed to save evidence:", evidenceError)
            return NextResponse.json({ error: "Failed to save evidence" }, { status: 500 })
        }

        // Update transaction status
        await supabase.from("transactions").update({ status: "rejected" }).eq("id", actualTransactionId)

        console.log(`[Reject Delivery] Evidence ${evidence.id} saved for transaction ${actualTransactionId}`)

        return NextResponse.json({
            success: true,
            data: {
                evidence_id: evidence.id,
                message: "Issue reported successfully",
            },
        })
    } catch (error: any) {
        console.error("[Reject Delivery] Error:", error)
        return NextResponse.json({ error: error.message || "Failed to process rejection" }, { status: 500 })
    }
}
