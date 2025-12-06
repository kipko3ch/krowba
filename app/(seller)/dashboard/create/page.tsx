import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CreateLinkWizard } from "@/components/seller/create-link-wizard"

export default async function CreateLinkPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/login")
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold font-serif text-foreground mb-2">Create Secure Link</h1>
          <p className="text-muted-foreground">Let AI help you list your item securely.</p>
        </div>

        <CreateLinkWizard />
      </div>
    </main>
  )
}
