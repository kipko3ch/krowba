"use client"

import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, Package, Truck, CheckCircle, AlertTriangle, XCircle, Shield } from "lucide-react"

interface DeliveryConfirmationProps {
  confirmation: {
    id: string
    transaction_id: string
    krowba_link_id: string
    buyer_phone: string
    confirmation_code: string
    transactions: {
      id: string
      buyer_phone: string
      buyer_name: string | null
      amount: number
      payment_type: string
    } | null
    krowba_links: {
      id: string
      item_name: string
      images: string[]
      short_code: string
      escrow_mode: string
      item_price: number
      delivery_fee: number
      sellers: {
        business_name: string
      } | null
    } | null
  }
  shippingProof: {
    courier_name: string
    courier_contact: string | null
    tracking_number: string | null
    dispatch_images: string[]
    dispatched_at: string
    ai_comparison_status: string
  } | null
}

export function DeliveryConfirmation({ confirmation, shippingProof }: DeliveryConfirmationProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isDisputing, setIsDisputing] = useState(false)
  const [status, setStatus] = useState<"idle" | "confirmed" | "disputed">("idle")
  const [disputeReason, setDisputeReason] = useState("")

  const link = confirmation.krowba_links
  const transaction = confirmation.transactions

  const handleConfirm = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/delivery/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmation_id: confirmation.id,
          confirmation_code: confirmation.confirmation_code,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to confirm delivery")
      }

      setStatus("confirmed")
      toast.success("Delivery confirmed! Payment released to seller.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to confirm")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDispute = async () => {
    if (!disputeReason.trim()) {
      toast.error("Please describe the issue")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/disputes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_id: confirmation.transaction_id,
          krowba_link_id: confirmation.krowba_link_id,
          reason: disputeReason,
          initiated_by: "buyer",
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit dispute")
      }

      setStatus("disputed")
      toast.success("Dispute submitted. We will review and contact you.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit")
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "confirmed") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="max-w-md w-full border border-border p-8 text-center">
          <div className="h-16 w-16 bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Delivery Confirmed!</h1>
          <p className="text-muted-foreground mb-4">
            Thank you for confirming. The payment has been released to the seller.
          </p>
          <p className="text-sm text-muted-foreground">You can close this page now.</p>
        </div>
      </div>
    )
  }

  if (status === "disputed") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="max-w-md w-full border border-border p-8 text-center">
          <div className="h-16 w-16 bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Dispute Submitted</h1>
          <p className="text-muted-foreground mb-4">
            {"We've received your dispute. Our team will review the evidence and contact you within 24 hours."}
          </p>
          <p className="text-sm text-muted-foreground">Reference: {confirmation.confirmation_code}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight">
            KROWBA
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <Package className="h-12 w-12 mx-auto mb-4" />
            <h1 className="text-2xl font-bold">Confirm Your Delivery</h1>
            <p className="text-muted-foreground">Did you receive your order?</p>
          </div>

          {/* Order Details */}
          <div className="border border-border p-4 mb-6">
            <div className="flex items-start gap-4">
              {link?.images[0] && (
                <img
                  src={link.images[0] || "/placeholder.svg"}
                  alt={link.item_name}
                  className="h-20 w-20 object-cover border border-border"
                />
              )}
              <div className="flex-1">
                <h3 className="font-medium">{link?.item_name}</h3>
                <p className="text-sm text-muted-foreground">From: {link?.sellers?.business_name}</p>
                <p className="text-sm font-medium mt-1">KES {Number(transaction?.amount || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Shipping Info */}
          {shippingProof && (
            <div className="border border-border p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="h-5 w-5" />
                <h3 className="font-medium">Shipping Details</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Courier</span>
                  <span className="capitalize">{shippingProof.courier_name.replace("_", " ")}</span>
                </div>
                {shippingProof.tracking_number && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tracking</span>
                    <span>{shippingProof.tracking_number}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dispatched</span>
                  <span>{format(new Date(shippingProof.dispatched_at), "PPp")}</span>
                </div>
              </div>

              {/* Dispatch Photos */}
              {shippingProof.dispatch_images.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Dispatch Photos</p>
                  <div className="grid grid-cols-3 gap-2">
                    {shippingProof.dispatch_images.map((url, i) => (
                      <img
                        key={i}
                        src={url || "/placeholder.svg"}
                        alt={`Dispatch ${i + 1}`}
                        className="aspect-square object-cover border border-border"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* AI Verification Badge */}
              {shippingProof.ai_comparison_status === "matched" && (
                <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>AI verified: Photos match original listing</span>
                </div>
              )}
              {shippingProof.ai_comparison_status === "warning" && (
                <div className="mt-4 flex items-center gap-2 text-sm text-yellow-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Slight differences detected - verify item carefully</span>
                </div>
              )}
            </div>
          )}

          {/* Confirm/Dispute Actions */}
          {!isDisputing ? (
            <div className="space-y-4">
              <Button onClick={handleConfirm} className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Yes, I Received My Order
                  </>
                )}
              </Button>

              <Button onClick={() => setIsDisputing(true)} variant="outline" className="w-full" size="lg">
                <XCircle className="h-4 w-4 mr-2" />
                {"No, I Have an Issue"}
              </Button>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Your payment is protected by Krowba escrow</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border border-border p-4">
                <h3 className="font-medium mb-3">{"What's the issue?"}</h3>
                <textarea
                  className="w-full border border-border p-3 text-sm min-h-[100px] bg-background"
                  placeholder="Describe the problem (e.g., item not received, wrong item, damaged, etc.)"
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                />
              </div>

              <Button onClick={handleDispute} variant="destructive" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Dispute"
                )}
              </Button>

              <Button onClick={() => setIsDisputing(false)} variant="ghost" className="w-full">
                Cancel
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
