import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/seller/dashboard-header"
import { ShippingForm } from "@/components/seller/shipping-form"

interface PageProps {
  params: Promise<{ transactionId: string }>
}

export default async function ShipPage({ params }: PageProps) {
  const { transactionId } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/login")
  }

  const { data: seller } = await supabase.from("sellers").select("*").eq("id", user.id).single()

  // Fetch transaction with link details
  const { data: transaction } = await supabase
    .from("transactions")
    .select(`
      *,
      krowba_links (
        id,
        item_name,
        images,
        short_code
      )
    `)
    .eq("id", transactionId)
    .eq("seller_id", user.id)
    .single()

  if (!transaction) {
    notFound()
  }

  // Check if already shipped
  const { data: existingProof } = await supabase
    .from("shipping_proofs")
    .select("id")
    .eq("transaction_id", transactionId)
    .single()

  if (existingProof) {
    redirect(`/dashboard/links/${transaction.krowba_links?.short_code}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader seller={seller} />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Ship Order</h1>
            <p className="text-muted-foreground">Upload dispatch proof for {transaction.krowba_links?.item_name}</p>
          </div>

          <ShippingForm transaction={transaction} linkImages={transaction.krowba_links?.images || []} />
        </div>
      </main>
    </div>
  )
}
