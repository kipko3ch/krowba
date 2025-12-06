// Escrow Management Service
// Handles fund release, refunds, and auto-release logic

import { createClient } from "@supabase/supabase-js"
import { paystack } from "@/lib/services/paystack"

// Lazy initialization to avoid build-time errors
const getSupabaseAdmin = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase environment variables not configured")
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export interface EscrowAction {
  success: boolean
  message: string
  amount?: number
  error?: string
}

export class EscrowService {
  // Release funds to seller via Paystack Transfer
  async releaseFunds(transactionId: string): Promise<EscrowAction> {
    try {
      // Fetch escrow hold
      const { data: escrow, error: escrowError } = await getSupabaseAdmin()
        .from("escrow_holds")
        .select("*, transactions(*), krowba_links(*)")
        .eq("transaction_id", transactionId)
        .single()

      if (escrowError || !escrow) {
        return { success: false, message: "Escrow not found", error: escrowError?.message }
      }

      if (escrow.status !== "held") {
        return {
          success: false,
          message: `Escrow already ${escrow.status}`,
          error: `Cannot release ${escrow.status} escrow`,
        }
      }

      // Get seller's bank account
      const { data: bankAccount } = await getSupabaseAdmin()
        .from("seller_bank_accounts")
        .select("*")
        .eq("seller_id", escrow.seller_id)
        .eq("is_default", true)
        .single()

      if (!bankAccount?.paystack_recipient_code) {
        // If no bank account linked, just mark as released (manual payout)
        console.log("[Escrow] No bank account linked - marking as released for manual payout")

        await getSupabaseAdmin()
          .from("escrow_holds")
          .update({
            status: "released",
            released_at: new Date().toISOString(),
          })
          .eq("id", escrow.id)

        await getSupabaseAdmin().from("krowba_links").update({ status: "completed" }).eq("id", escrow.krowba_link_id)

        return {
          success: true,
          message: "Escrow released (manual payout pending - no bank account linked)",
          amount: Number(escrow.amount),
        }
      }

      // Initiate Paystack transfer
      const transferRef = `TRF_${transactionId.slice(0, 8)}_${Date.now()}`
      const transferResult = await paystack.initiateTransfer({
        amount: Number(escrow.amount) * 100, // Convert to Kobo
        recipient: bankAccount.paystack_recipient_code,
        reason: `Krowba payout for ${escrow.krowba_links?.item_name || 'sale'}`,
        reference: transferRef,
      })

      if (!transferResult.success) {
        return {
          success: false,
          message: "Transfer initiation failed",
          error: transferResult.error,
        }
      }

      // Update escrow with transfer reference (wait for webhook to confirm)
      await getSupabaseAdmin()
        .from("escrow_holds")
        .update({
          transfer_reference: transferRef,
          updated_at: new Date().toISOString(),
        })
        .eq("id", escrow.id)

      console.log(`[Escrow] Transfer initiated: ${escrow.amount} KES to seller ${escrow.seller_id}`)

      return {
        success: true,
        message: "Transfer initiated - funds will be released shortly",
        amount: Number(escrow.amount),
      }
    } catch (error) {
      console.error("[Escrow] Release error:", error)
      return {
        success: false,
        message: "Failed to release funds",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  // Refund buyer
  async refundBuyer(transactionId: string, reason: string): Promise<EscrowAction> {
    try {
      // Fetch escrow hold
      const { data: escrow, error: escrowError } = await getSupabaseAdmin()
        .from("escrow_holds")
        .select("*, transactions(*), krowba_links(*)")
        .eq("transaction_id", transactionId)
        .single()

      if (escrowError || !escrow) {
        return { success: false, message: "Escrow not found", error: escrowError?.message }
      }

      if (escrow.status === "refunded") {
        return { success: false, message: "Already refunded" }
      }

      if (escrow.status === "released") {
        return { success: false, message: "Funds already released to seller" }
      }

      // Update escrow status
      await getSupabaseAdmin()
        .from("escrow_holds")
        .update({
          status: "refunded",
          refunded_at: new Date().toISOString(),
        })
        .eq("id", escrow.id)

      // Update transaction
      await getSupabaseAdmin().from("transactions").update({ status: "refunded" }).eq("id", transactionId)

      // Update link status
      await getSupabaseAdmin().from("krowba_links").update({ status: "cancelled" }).eq("id", escrow.krowba_link_id)

      console.log(`[Escrow] Refunded ${escrow.amount} to buyer (reason: ${reason})`)

      // Note: In production, initiate M-Pesa B2C transfer here

      return {
        success: true,
        message: "Refund initiated",
        amount: Number(escrow.amount),
      }
    } catch (error) {
      console.error("[Escrow] Refund error:", error)
      return {
        success: false,
        message: "Failed to process refund",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  // Auto-release after buyer unresponsive (24+ hours after shipping)
  async autoRelease(transactionId: string): Promise<EscrowAction> {
    try {
      // Check shipping proof exists and is old enough
      const { data: proof, error: proofError } = await getSupabaseAdmin()
        .from("shipping_proofs")
        .select("*, transactions(*), escrow_holds(*)")
        .eq("transaction_id", transactionId)
        .single()

      if (proofError || !proof) {
        return { success: false, message: "No shipping proof found" }
      }

      const dispatchedAt = new Date(proof.dispatched_at)
      const now = new Date()
      const hoursElapsed = (now.getTime() - dispatchedAt.getTime()) / (1000 * 60 * 60)

      if (hoursElapsed < 24) {
        return {
          success: false,
          message: `Auto-release available in ${Math.ceil(24 - hoursElapsed)} hours`,
        }
      }

      // Check if buyer has confirmed
      const { data: confirmation } = await getSupabaseAdmin()
        .from("delivery_confirmations")
        .select("confirmed")
        .eq("transaction_id", transactionId)
        .single()

      if (confirmation?.confirmed) {
        return { success: false, message: "Already confirmed by buyer" }
      }

      // Check if there's a dispute
      const { data: dispute } = await getSupabaseAdmin()
        .from("disputes")
        .select("id, resolution")
        .eq("transaction_id", transactionId)
        .single()

      if (dispute && dispute.resolution === "pending") {
        return { success: false, message: "Active dispute exists" }
      }

      // Proceed with auto-release
      await getSupabaseAdmin()
        .from("delivery_confirmations")
        .update({
          confirmed: true,
          confirmed_at: new Date().toISOString(),
          auto_confirmed: true,
        })
        .eq("transaction_id", transactionId)

      return this.releaseFunds(transactionId)
    } catch (error) {
      console.error("[Escrow] Auto-release error:", error)
      return {
        success: false,
        message: "Failed to auto-release",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  // Resolve dispute
  async resolveDispute(
    disputeId: string,
    resolution: "refund_buyer" | "pay_seller" | "partial_refund",
    partialAmount?: number,
  ): Promise<EscrowAction> {
    try {
      const { data: dispute, error: disputeError } = await getSupabaseAdmin()
        .from("disputes")
        .select("*, transactions(*), escrow_holds(*)")
        .eq("id", disputeId)
        .single()

      if (disputeError || !dispute) {
        return { success: false, message: "Dispute not found" }
      }

      // Update dispute resolution
      await getSupabaseAdmin()
        .from("disputes")
        .update({
          resolution,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", disputeId)

      if (resolution === "refund_buyer") {
        return this.refundBuyer(dispute.transaction_id, "Dispute resolved in buyer's favor")
      }

      if (resolution === "pay_seller") {
        return this.releaseFunds(dispute.transaction_id)
      }

      if (resolution === "partial_refund" && partialAmount) {
        // Partial refund logic - complex case
        // In production: refund partialAmount to buyer, release rest to seller
        console.log(`[Escrow] Partial refund: ${partialAmount} to buyer, rest to seller`)

        await getSupabaseAdmin()
          .from("escrow_holds")
          .update({
            status: "released",
            released_at: new Date().toISOString(),
          })
          .eq("transaction_id", dispute.transaction_id)

        return {
          success: true,
          message: `Partial refund of ${partialAmount} processed`,
          amount: partialAmount,
        }
      }

      return { success: false, message: "Invalid resolution type" }
    } catch (error) {
      console.error("[Escrow] Resolve dispute error:", error)
      return {
        success: false,
        message: "Failed to resolve dispute",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  // Check for stale escrows (for scheduled job)
  async getStaleEscrows(hoursOld = 24): Promise<string[]> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setHours(cutoffDate.getHours() - hoursOld)

      const { data: staleEscrows } = await getSupabaseAdmin()
        .from("escrow_holds")
        .select(`
          transaction_id,
          shipping_proofs!inner (
            dispatched_at
          )
        `)
        .eq("status", "held")
        .lt("shipping_proofs.dispatched_at", cutoffDate.toISOString())

      return staleEscrows?.map((e) => e.transaction_id) || []
    } catch (error) {
      console.error("[Escrow] Get stale error:", error)
      return []
    }
  }
}

export const escrowService = new EscrowService()

