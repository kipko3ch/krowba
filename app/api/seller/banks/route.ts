import { NextResponse } from "next/server"
import { paystack } from "@/lib/services/paystack"

// GET /api/seller/banks
// Get list of Kenyan banks from Paystack
export async function GET() {
    try {
        const banks = await paystack.listBanks("kenya")

        return NextResponse.json({
            success: true,
            data: banks,
        })
    } catch (error) {
        console.error("[Banks API] Error:", error)
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to fetch banks",
            },
            { status: 500 }
        )
    }
}
