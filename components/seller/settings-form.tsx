"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, LogOut } from "lucide-react"
import type { Seller } from "@/types"

interface SettingsFormProps {
  seller: Seller | null
  userEmail: string
}

export function SettingsForm({ seller, userEmail }: SettingsFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    business_name: seller?.business_name || "",
    phone: seller?.phone || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("sellers")
        .update({
          business_name: formData.business_name,
          phone: formData.phone,
        })
        .eq("id", seller?.id)

      if (error) throw error

      toast.success("Settings updated successfully")
      router.refresh()
    } catch (error) {
      toast.error("Failed to update settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div className="space-y-8">
      {/* Business Profile */}
      <form onSubmit={handleSubmit} className="border border-border p-6 space-y-4">
        <h2 className="font-semibold">Business Profile</h2>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={userEmail} disabled className="bg-secondary/30" />
          <p className="text-xs text-muted-foreground">Email cannot be changed</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="business_name">Business Name</Label>
          <Input
            id="business_name"
            value={formData.business_name}
            onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </form>

      {/* Account Stats */}
      <div className="border border-border p-6">
        <h2 className="font-semibold mb-4">Account Statistics</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Total Transactions</div>
            <div className="text-2xl font-bold">{seller?.total_transactions || 0}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Successful</div>
            <div className="text-2xl font-bold">{seller?.successful_transactions || 0}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
            <div className="text-2xl font-bold">
              {seller && seller.total_transactions > 0
                ? Math.round((seller.successful_transactions / seller.total_transactions) * 100)
                : 100}
              %
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Trust Score</div>
            <div className="text-2xl font-bold">{seller?.verification_score || 0}</div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border border-destructive/50 p-6">
        <h2 className="font-semibold mb-4 text-destructive">Danger Zone</h2>
        <Button variant="destructive" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
