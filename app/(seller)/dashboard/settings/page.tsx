import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SettingsForm } from "@/components/seller/settings-form"

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/login")
  }

  const { data: seller } = await supabase.from("sellers").select("*").eq("id", user.id).single()

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and business profile
          </p>
        </div>

        <SettingsForm seller={seller} userEmail={user.email || ""} />
      </div>
    </main>
  )
}
