import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { payoutService } from "@/lib/services/payout"

// GET /api/seller/payout-history
// Get seller's payout history with pagination
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get query parameters
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "20")

        // Fetch payout history
        const result = await payoutService.getPayoutHistory(user.id, { page, limit })

        return NextResponse.json({
            success: true,
            data: result.data,
            pagination: {
                page,
                limit,
                total: result.total,
                totalPages: Math.ceil(result.total / limit),
            },
        })
    } catch (error) {
        console.error("[Payout History] Error:", error)
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to fetch payout history",
            },
            { status: 500 }
        )
    }
}
