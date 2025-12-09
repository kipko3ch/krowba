import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/mock/transactions
// List all transactions for the authenticated seller
export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get seller transactions
        const { data: transactions, error } = await supabase
            .from("transactions")
            .select(
                `
                id,
                amount,
                payment_method,
                payment_reference,
                status,
                created_at,
                updated_at,
                krowba_links(item_name, currency),
                escrow_holds(status)
            `
            )
            .eq("seller_id", user.id)
            .order("created_at", { ascending: false })
            .limit(100)

        if (error) {
            throw new Error(error.message)
        }

        // Format response
        const formattedTransactions = transactions?.map((t: any) => ({
            id: t.id,
            transaction_reference: t.payment_reference || "N/A",
            amount: Number(t.amount),
            currency: t.krowba_links?.currency || "KES",
            status: t.status,
            payment_method: t.payment_method || "mobile",
            message: getStatusMessage(t.status, t.escrow_holds?.[0]?.status),
            created_at: t.created_at,
            updated_at: t.updated_at,
        }))

        return NextResponse.json({
            success: true,
            data: formattedTransactions || [],
        })
    } catch (error) {
        console.error("[Mock Transactions] Error:", error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to fetch transactions",
            },
            { status: 500 }
        )
    }
}

function getStatusMessage(txStatus: string, escrowStatus?: string): string {
    if (escrowStatus === "held") return "Funds locked in escrow"
    if (escrowStatus === "released") return "Funds released to available balance"
    if (escrowStatus === "refunded") return "Refunded to buyer"
    if (txStatus === "completed") return "Payment completed"
    if (txStatus === "failed") return "Payment failed"
    return "Processing"
}
