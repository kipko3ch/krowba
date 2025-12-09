import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { mockWalletService } from "@/lib/services/mockWalletService"

// GET /api/mock/wallet
// Get seller's virtual wallet balances
export async function GET() {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const wallet = await mockWalletService.getWalletBalances(user.id)

        return NextResponse.json({
            success: true,
            data: wallet,
        })
    } catch (error) {
        console.error("[Mock Wallet] Error:", error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to fetch wallet",
            },
            { status: 500 }
        )
    }
}
