import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        const body = await request.json()
        const { confirmation_id, reason, evidence_photos } = body

        if (!confirmation_id) {
            return NextResponse.json({ error: "Confirmation ID required" }, { status: 400 })
        }

        if (!reason || reason.trim() === "") {
            return NextResponse.json({ error: "Please describe the issue" }, { status: 400 })
        }

        // Get confirmation details
        const { data: confirmation, error: confError } = await supabase
            .from("delivery_confirmations")
            .select("*, transactions(*)")
            .eq("id", confirmation_id)
            .single()

        if (confError || !confirmation) {
            return NextResponse.json({ error: "Confirmation not found" }, { status: 404 })
        }

        // Create delivery evidence record
        const { data: evidence, error: evidenceError } = await supabase
            .from("delivery_evidence")
            .insert({
                transaction_id: confirmation.transaction_id,
                delivery_confirmation_id: confirmation_id,
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

        // Update delivery confirmation
        await supabase
            .from("delivery_confirmations")
            .update({
                action_type: "reject",
                evidence_id: evidence.id,
            })
            .eq("id", confirmation_id)

        // Update transaction status
        await supabase.from("transactions").update({ status: "rejected" }).eq("id", confirmation.transaction_id)

        console.log(`[Reject Delivery] Evidence ${evidence.id} saved for transaction ${confirmation.transaction_id}`)

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
