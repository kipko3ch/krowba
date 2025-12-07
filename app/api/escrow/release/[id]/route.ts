import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { escrowService } from "@/lib/services/escrowService"

// POST /api/escrow/release/:id
// Internal endpoint to release escrow after delivery confirmation
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const escrowId = params.id

        if (!escrowId) {
            return NextResponse.json({ error: "Escrow ID is required" }, { status: 400 })
        }

        // Verify authentication
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Release escrow (this will also initiate payout)
        const result = await escrowService.releaseEscrow(escrowId)

        return NextResponse.json({
            success: true,
            message: "Escrow released and payout initiated",
            data: result,
        })
    } catch (error) {
        console.error("[Escrow Release] Error:", error)
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to release escrow",
            },
            { status: 500 }
        )
    }
}
