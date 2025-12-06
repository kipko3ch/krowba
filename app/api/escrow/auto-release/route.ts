import { type NextRequest, NextResponse } from "next/server"
import { escrowService } from "@/lib/services/escrow"

// Cron job endpoint for auto-releasing stale escrows
// Can be called by Vercel Cron or external scheduler
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const cronSecret = request.headers.get("x-cron-secret")
    const expectedSecret = process.env.CRON_SECRET

    if (expectedSecret && cronSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get stale escrows (24+ hours since shipping)
    const staleTransactions = await escrowService.getStaleEscrows(24)

    const results = []
    for (const transactionId of staleTransactions) {
      const result = await escrowService.autoRelease(transactionId)
      results.push({
        transaction_id: transactionId,
        ...result,
      })
    }

    console.log(`[Auto-Release] Processed ${results.length} escrows`)

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error("[Auto-Release] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
