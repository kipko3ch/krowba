import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { mockPaymentService } from "@/lib/services/mockPaymentService"
import { escrowService } from "@/lib/services/escrowService"
import type { MockPaymentRequest } from "@/types"

// POST /api/mock/payments
// Process a mock payment (card or mobile)
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const body: MockPaymentRequest = await request.json()

        const { payment_method, amount, krowba_link_id, buyer_phone, buyer_name, card_number, card_expiry, card_cvv } = body

        // Validate required fields
        if (!payment_method || !amount || !krowba_link_id || !buyer_phone) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Missing required fields: payment_method, amount, krowba_link_id, buyer_phone",
                },
                { status: 400 }
            )
        }

        // Validate payment method
        if (payment_method !== "card" && payment_method !== "mobile") {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid payment_method. Must be 'card' or 'mobile'",
                },
                { status: 400 }
            )
        }

        // Get krowba link details
        const { data: link, error: linkError } = await supabase
            .from("krowba_links")
            .select("*, sellers(id)")
            .eq("id", krowba_link_id)
            .single()

        if (linkError || !link) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Krowba link not found",
                },
                { status: 404 }
            )
        }

        // Process mock payment
        const paymentResult = await mockPaymentService.processPayment({
            payment_method,
            amount,
            krowba_link_id,
            buyer_phone,
            buyer_name,
            card_number,
            card_expiry,
            card_cvv,
        })

        if (!paymentResult.success) {
            return NextResponse.json(paymentResult, { status: 400 })
        }

        // Create transaction record
        const { data: transaction, error: txError } = await supabase
            .from("transactions")
            .insert({
                krowba_link_id,
                seller_id: link.sellers.id,
                buyer_phone,
                buyer_name: buyer_name || null,
                amount,
                payment_type: "full",
                payment_method,
                payment_reference: paymentResult.reference,
                status: "completed",
            })
            .select()
            .single()

        if (txError) {
            console.error("[Mock Payment] Failed to create transaction:", txError)
            return NextResponse.json(
                {
                    success: false,
                    error: "Failed to record transaction",
                },
                { status: 500 }
            )
        }

        // Lock funds in escrow
        try {
            await escrowService.lockEscrow(transaction.id)
        } catch (escrowError) {
            console.error("[Mock Payment] Failed to lock escrow:", escrowError)
            // Transaction was created but escrow failed - this is logged but we still return success
        }

        // Update link status to 'paid'
        await supabase.from("krowba_links").update({ status: "paid" }).eq("id", krowba_link_id)

        return NextResponse.json({
            ...paymentResult,
            transaction_id: transaction.id,
        })
    } catch (error) {
        console.error("[Mock Payment] Error:", error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Payment processing failed",
            },
            { status: 500 }
        )
    }
}
