import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TransactionsTable } from "@/components/seller/transactions-table"

export default async function TransactionsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/login")
  }

  const { data: transactions } = await supabase
    .from("transactions")
    .select(`
      *,
      krowba_links (
        item_name,
        short_code,
        images
      ),
      escrow_holds (
        amount,
        status
      ),
      shipping_proofs (
        courier_name,
        dispatched_at
      )
    `)
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <p className="text-muted-foreground">Track payments and manage deliveries</p>
      </div>

      <TransactionsTable transactions={transactions || []} />
    </main>
  )
}
