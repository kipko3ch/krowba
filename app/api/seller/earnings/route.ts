import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { escrowService } from "@/lib/services/escrowService"

// GET /api/seller/earnings
// Get seller's earnings overview (pending, available, total paid out)
export async function GET() {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Fetch earnings summary
        const earnings = await escrowService.getSellerEscrowSummary(user.id)

        return NextResponse.json({
            success: true,
            data: earnings,
        })
    } catch (error) {
        console.error("[Seller Earnings] Error:", error)
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to fetch earnings",
            },
            { status: 500 }
        )
    }
}
