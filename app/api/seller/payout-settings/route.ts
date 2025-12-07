import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { payoutService } from "@/lib/services/payout"
import { paystack } from "@/lib/services/paystack"

// GET /api/seller/payout-settings
// Get seller's current payout settings
export async function GET() {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const settings = await payoutService.getPayoutSettings(user.id)

        return NextResponse.json({
            success: true,
            data: settings,
        })
    } catch (error) {
        console.error("[Payout Settings GET] Error:", error)
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to fetch payout settings",
            },
            { status: 500 }
        )
    }
}

// POST /api/seller/payout-settings
// Create or update seller payout settings
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
        const { account_type, account_details } = body

        // Validate input
        if (!account_type || !["bank", "mpesa"].includes(account_type)) {
            return NextResponse.json(
                { error: "Invalid account type. Must be 'bank' or 'mpesa'" },
                { status: 400 }
            )
        }

        if (account_type === "bank") {
            if (!account_details?.bank_code || !account_details?.account_number) {
                return NextResponse.json(
                    { error: "Bank code and account number are required" },
                    { status: 400 }
                )
            }

            // Get bank name from Paystack
            const banks = await paystack.listBanks("kenya")
            const bank = banks.find((b) => b.code === account_details.bank_code)
            if (bank) {
                account_details.bank_name = bank.name
            }
        } else if (account_type === "mpesa") {
            if (!account_details?.phone_number) {
                return NextResponse.json(
                    { error: "Phone number is required for M-Pesa" },
                    { status: 400 }
                )
            }
        }

        // Create or update settings
        const result = await payoutService.createOrUpdatePayoutSettings(user.id, {
            account_type,
            account_details,
        })

        return NextResponse.json({
            success: true,
            message: "Payout settings saved successfully",
            data: result,
        })
    } catch (error) {
        console.error("[Payout Settings POST] Error:", error)
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to save payout settings",
            },
            { status: 500 }
        )
    }
}
