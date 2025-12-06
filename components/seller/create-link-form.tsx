"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ImageUploader } from "@/components/seller/image-uploader"
import { toast } from "sonner"
import { Loader2, Shield, AlertTriangle, Package, DollarSign, Lock } from "lucide-react"
import type { EscrowMode } from "@/types"

interface CreateLinkFormProps {
  sellerId: string
}

export function CreateLinkForm({ sellerId }: CreateLinkFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [escrowMode, setEscrowMode] = useState<EscrowMode>("full_escrow")

  const [formData, setFormData] = useState({
    item_name: "",
    description: "",
    item_price: "",
    delivery_fee: "",
    deposit_amount: "",
    access_pin: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (images.length === 0) {
      toast.error("Please upload at least one product image")
      return
    }

    if (!formData.item_name || !formData.item_price) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/seller/create-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seller_id: sellerId,
          item_name: formData.item_name,
          description: formData.description,
          item_price: Number.parseFloat(formData.item_price),
          delivery_fee: Number.parseFloat(formData.delivery_fee) || 0,
          escrow_mode: escrowMode,
          deposit_amount:
            escrowMode === "split_risk"
              ? Number.parseFloat(formData.deposit_amount) || Number.parseFloat(formData.delivery_fee) || 0
              : null,
          access_pin: formData.access_pin || null,
          images,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        const details = result.details ? ` (${JSON.stringify(result.details)})` : ""
        throw new Error((result.error || "Failed to create link") + details)
      }

      toast.success("Krowba link created successfully!")
      router.push(`/dashboard/links/${result.data.short_code}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create link")
    } finally {
      setIsLoading(false)
    }
  }

  const totalAmount = (Number.parseFloat(formData.item_price) || 0) + (Number.parseFloat(formData.delivery_fee) || 0)

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Form Inputs */}
      <div className="lg:col-span-2 space-y-6">
        {/* Product Details */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Product Details</h2>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item_name" className="text-foreground">Item Name *</Label>
            <Input
              id="item_name"
              placeholder="e.g., iPhone 14 Pro Max 256GB"
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              required
              className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your item (condition, color, included accessories...)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item_price" className="text-foreground">Price (KES) *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="item_price"
                  type="number"
                  min="1"
                  placeholder="50000"
                  value={formData.item_price}
                  onChange={(e) => setFormData({ ...formData, item_price: e.target.value })}
                  required
                  className="pl-10 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery_fee" className="text-foreground">Delivery Fee (KES)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="delivery_fee"
                  type="number"
                  min="0"
                  placeholder="500"
                  value={formData.delivery_fee}
                  onChange={(e) => setFormData({ ...formData, delivery_fee: e.target.value })}
                  className="pl-10 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="access_pin" className="text-foreground">Security PIN (Optional)</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="access_pin"
                type="text"
                placeholder="e.g., 1234"
                value={formData.access_pin}
                onChange={(e) => setFormData({ ...formData, access_pin: e.target.value })}
                className="pl-10 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Set a PIN to restrict access to this link. Buyers will need to enter this PIN to view the payment page.
            </p>
          </div>
        </div>

        {/* Product Images */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Product Images *</h2>
          <p className="text-sm text-muted-foreground">
            Upload 1-5 clear photos. Our AI will verify these match your description.
          </p>
          <ImageUploader images={images} onImagesChange={setImages} maxImages={5} folder="products" />
        </div>
      </div>

      {/* Right Column - Sticky Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        <div className="lg:sticky lg:top-6 space-y-6">
          {/* Payment Protection */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Payment Protection</h2>

            <RadioGroup value={escrowMode} onValueChange={(v) => setEscrowMode(v as EscrowMode)} className="space-y-3">
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-all ${escrowMode === "full_escrow"
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border hover:border-primary/60"
                  }`}
                onClick={() => setEscrowMode("full_escrow")}
              >
                <div className="flex items-start gap-3">
                  <RadioGroupItem value="full_escrow" id="full_escrow" className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="full_escrow" className="font-medium cursor-pointer text-foreground flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      Full Escrow
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum protection. Funds held until delivery confirmed.
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`border rounded-lg p-4 cursor-pointer transition-all ${escrowMode === "split_risk"
                  ? "border-yellow-500 bg-yellow-500/10 shadow-sm"
                  : "border-border hover:border-yellow-500/60"
                  }`}
                onClick={() => setEscrowMode("split_risk")}
              >
                <div className="flex items-start gap-3">
                  <RadioGroupItem value="split_risk" id="split_risk" className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="split_risk" className="font-medium cursor-pointer text-foreground flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      Deposit Only
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Lower upfront cost. Balance paid on delivery.
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>

            {escrowMode === "split_risk" && (
              <div className="space-y-2 pt-2 animate-in slide-in-from-top-2">
                <Label htmlFor="deposit_amount" className="text-foreground text-sm">Deposit Amount (KES)</Label>
                <Input
                  id="deposit_amount"
                  type="number"
                  min="1"
                  placeholder={formData.delivery_fee || "500"}
                  value={formData.deposit_amount}
                  onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
                  className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground">Leave empty to use delivery fee</p>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-primary/5 backdrop-blur-sm border border-primary/20 rounded-lg p-4 sm:p-6 space-y-4 shadow-lg">
            <h2 className="text-lg font-semibold text-foreground">Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Item Price</span>
                <span className="text-foreground font-medium">KES {(Number.parseFloat(formData.item_price) || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span className="text-foreground font-medium">KES {(Number.parseFloat(formData.delivery_fee) || 0).toLocaleString()}</span>
              </div>
              <div className="border-t border-primary/20 pt-3 flex justify-between items-center">
                <span className="text-foreground font-semibold">Total</span>
                <span className="text-primary font-bold text-lg">KES {totalAmount.toLocaleString()}</span>
              </div>
              {escrowMode === "split_risk" && (
                <div className="flex justify-between items-center text-xs pt-2 border-t border-primary/10">
                  <span className="text-muted-foreground">Buyer pays upfront</span>
                  <span className="text-yellow-600 dark:text-yellow-500 font-medium">
                    KES{" "}
                    {(
                      Number.parseFloat(formData.deposit_amount) ||
                      Number.parseFloat(formData.delivery_fee) ||
                      0
                    ).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all hover:shadow-lg hover:shadow-primary/50"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Link...
                </>
              ) : (
                "Create Krowba Link"
              )}
            </Button>
          </div>
        </div>
      </div>
    </form >
  )
}
