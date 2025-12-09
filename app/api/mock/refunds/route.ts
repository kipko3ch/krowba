import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { escrowService } from "@/lib/services/escrowService"
import type { RefundRequest } from "@/types"

// POST /api/mock/refunds
// Simulate a refund (partial or full)
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const body: RefundRequest = await request.json()

        const { transaction_id, type, amount, reason, initiated_by } = body

        // Validate required fields
        if (!transaction_id || !type || !reason || !initiated_by) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Missing required fields: transaction_id, type, reason, initiated_by",
                },
                { status: 400 }
            )
        }

        // Validate partial refund has amount
        if (type === "partial" && !amount) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Partial refunds require an amount",
                },
                { status: 400 }
            )
        }

        // Get escrow hold for this transaction
        const { data: escrowHold, error: escrowError } = await supabase
            .from("escrow_holds")
            .select("*")
            .eq("transaction_id", transaction_id)
            .single()

        if (escrowError || !escrowHold) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Escrow hold not found for this transaction",
                },
                { status: 404 }
            )
        }

        // Check if escrow is in correct status
        if (escrowHold.status !== "held") {
            return NextResponse.json(
                {
                    success: false,
                    error: `Cannot refund escrow with status: ${escrowHold.status}`,
                },
                { status: 400 }
            )
        }

        // Simulate refund processing delay
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // Process refund
        if (type === "full") {
            await escrowService.refundEscrow(escrowHold.id, reason)

            return NextResponse.json({
                success: true,
                data: {
                    type: "full",
                    amount: escrowHold.amount,
                    message: `Full refund of KES ${escrowHold.amount.toLocaleString()} processed successfully`,
                    webhook_status: "processed",
                },
            })
        } else {
            // Partial refund
            const refundAmount = amount!

            if (refundAmount > escrowHold.amount) {
                return NextResponse.json(
                    {
                        success: false,
                        error: `Refund amount (${refundAmount}) exceeds escrow amount (${escrowHold.amount})`,
                    },
                    { status: 400 }
                )
            }

            // For partial refunds, we'll still mark as refunded but store the partial amount
            await escrowService.refundEscrow(escrowHold.id, `Partial refund: ${reason}`)

            // Update transaction to reflect partial refund
            await supabase.from("transactions").update({ status: "refunded" }).eq("id", transaction_id)

            return NextResponse.json({
                success: true,
                data: {
                    type: "partial",
                    amount: refundAmount,
                    remaining: escrowHold.amount - refundAmount,
                    message: `Partial refund of KES ${refundAmount.toLocaleString()} processed successfully`,
                    webhook_status: "processed",
                },
            })
        }
    } catch (error) {
        console.error("[Mock Refund] Error:", error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Refund processing failed",
                webhook_status: "failed",
            },
            { status: 500 }
        )
    }
}
