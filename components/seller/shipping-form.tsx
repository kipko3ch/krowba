"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUploader } from "@/components/seller/image-uploader"
import { toast } from "sonner"
import { Loader2, Package, Truck, AlertCircle } from "lucide-react"

interface ShippingFormProps {
  transaction: {
    id: string
    krowba_link_id: string
    buyer_phone: string
    buyer_name: string | null
    amount: number
    krowba_links?: {
      id: string
      item_name: string
      images: string[]
      short_code: string
    } | null
  }
  linkImages: string[]
}

const COURIER_OPTIONS = [
  { value: "g4s", label: "G4S Courier" },
  { value: "fargo", label: "Fargo Courier" },
  { value: "wells_fargo", label: "Wells Fargo" },
  { value: "sendy", label: "Sendy" },
  { value: "boda", label: "Boda Rider" },
  { value: "self", label: "Self Delivery" },
  { value: "other", label: "Other" },
]

export function ShippingForm({ transaction, linkImages }: ShippingFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [videoUrl, setVideoUrl] = useState("")

  const [formData, setFormData] = useState({
    courier_name: "",
    courier_contact: "",
    tracking_number: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.courier_name) {
      toast.error("Please select a courier")
      return
    }

    if (images.length === 0) {
      toast.error("Please upload at least one dispatch proof photo")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/shipping/dispatch-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_id: transaction.id,
          krowba_link_id: transaction.krowba_link_id,
          courier_name: formData.courier_name,
          courier_contact: formData.courier_contact,
          tracking_number: formData.tracking_number,
          dispatch_images: images,
          dispatch_video: videoUrl || null,
          original_product_image: linkImages[0],
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit shipping proof")
      }

      toast.success("Shipping proof submitted! Buyer will be notified.")
      router.push(`/dashboard/links/${transaction.krowba_links?.short_code}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Order Info */}
      <div className="border border-border p-4 bg-secondary/30">
        <div className="flex items-start gap-4">
          {linkImages[0] && (
            <img
              src={linkImages[0] || "/placeholder.svg"}
              alt="Product"
              className="h-16 w-16 object-cover border border-border"
            />
          )}
          <div className="flex-1">
            <h3 className="font-medium">{transaction.krowba_links?.item_name}</h3>
            <p className="text-sm text-muted-foreground">Buyer: {transaction.buyer_name || transaction.buyer_phone}</p>
            <p className="text-sm font-medium mt-1">KES {Number(transaction.amount).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Courier Details */}
      <div className="border border-border p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Truck className="h-5 w-5" />
          <h2 className="font-semibold">Courier Details</h2>
        </div>

        <div className="space-y-2">
          <Label htmlFor="courier">Courier / Delivery Method *</Label>
          <Select value={formData.courier_name} onValueChange={(v) => setFormData({ ...formData, courier_name: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select courier" />
            </SelectTrigger>
            <SelectContent>
              {COURIER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tracking">Tracking Number</Label>
            <Input
              id="tracking"
              placeholder="e.g., TRK123456"
              value={formData.tracking_number}
              onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact">Courier Contact</Label>
            <Input
              id="contact"
              placeholder="e.g., 0712345678"
              value={formData.courier_contact}
              onChange={(e) => setFormData({ ...formData, courier_contact: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Dispatch Proof Photos */}
      <div className="border border-border p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Package className="h-5 w-5" />
          <h2 className="font-semibold">Dispatch Proof Photos *</h2>
        </div>

        <div className="flex items-start gap-2 p-3 bg-secondary/50 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Photo Tips:</p>
            <ul className="text-muted-foreground mt-1 space-y-1">
              <li>- Show the item being packaged</li>
              <li>- Include the shipping label if available</li>
              <li>- Capture the handoff to courier</li>
            </ul>
          </div>
        </div>

        <ImageUploader images={images} onImagesChange={setImages} maxImages={5} folder="dispatch" />
      </div>

      {/* Optional Video */}
      <div className="border border-border p-6 space-y-4">
        <h2 className="font-semibold">Video Proof (Optional)</h2>
        <p className="text-sm text-muted-foreground">
          Upload a short video showing the item and packaging for extra verification.
        </p>
        <Input
          placeholder="Paste video URL (YouTube, Google Drive, etc.)"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />
      </div>

      {/* Notes */}
      <div className="border border-border p-6 space-y-4">
        <h2 className="font-semibold">Notes for Buyer (Optional)</h2>
        <Textarea
          placeholder="Any special delivery instructions or notes..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Submitting Proof...
          </>
        ) : (
          <>
            <Truck className="h-4 w-4 mr-2" />
            Confirm Dispatch
          </>
        )}
      </Button>
    </form>
  )
}
