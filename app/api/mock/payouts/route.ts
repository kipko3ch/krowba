import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { mockWalletService } from "@/lib/services/mockWalletService"

// POST /api/mock/payouts
// Simulate a payout (moves funds from available to paid)
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { amount } = body

        // Process payout
        const result = await mockWalletService.simulatePayout(user.id, amount)

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: result.message,
                },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            data: {
                reference: result.reference,
                amount: result.amount,
                message: result.message,
            },
        })
    } catch (error) {
        console.error("[Mock Payout] Error:", error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Payout failed",
            },
            { status: 500 }
        )
    }
}

// GET /api/mock/payouts
// Get payout history
export async function GET() {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const history = await mockWalletService.getPayoutHistory(user.id)

        return NextResponse.json({
            success: true,
            data: history,
        })
    } catch (error) {
        console.error("[Mock Payouts History] Error:", error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to fetch payout history",
            },
            { status: 500 }
        )
    }
}
