import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { LinksTable } from "@/components/seller/links-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function LinksPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/login")
  }

  const { data: links } = await supabase
    .from("krowba_links")
    .select(`
      *,
      transactions(
        id,
        status,
        refund_status,
        refund_reason,
        refunded_at,
        delivery_evidence(
          id,
          description,
          evidence_photos,
          created_at
        )
      )
    `)
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Links</h1>
          <p className="text-muted-foreground">Manage your Krowba payment links</p>
        </div>
        <Link href="/dashboard/create">
          <Button className="bg-[#44f91f] hover:bg-[#3de018] text-black font-bold">
            <Plus className="h-4 w-4 mr-2" />
            Create Link
          </Button>
        </Link>
      </div>

      <LinksTable links={links || []} showTabs={true} />
    </main>
  )
}
