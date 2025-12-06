import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DeliveryConfirmation } from "@/components/buyer/delivery-confirmation"

interface PageProps {
  params: Promise<{ code: string }>
}

export default async function ConfirmDeliveryPage({ params }: PageProps) {
  const { code } = await params
  const supabase = await createClient()

  // Find the delivery confirmation by code
  const { data: confirmation } = await supabase
    .from("delivery_confirmations")
    .select(`
      *,
      transactions (
        id,
        buyer_phone,
        buyer_name,
        amount,
        payment_type
      ),
      krowba_links (
        id,
        item_name,
        images,
        short_code,
        escrow_mode,
        item_price,
        delivery_fee,
        sellers (
          business_name
        )
      )
    `)
    .eq("confirmation_code", code)
    .single()

  if (!confirmation) {
    notFound()
  }

  // Check if already confirmed
  if (confirmation.confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="max-w-md w-full border border-border p-8 text-center">
          <h1 className="text-xl font-bold mb-2">Already Confirmed</h1>
          <p className="text-muted-foreground">
            This delivery was already confirmed on {new Date(confirmation.confirmed_at).toLocaleDateString()}.
          </p>
        </div>
      </div>
    )
  }

  // Fetch shipping proof
  const { data: shippingProof } = await supabase
    .from("shipping_proofs")
    .select("*")
    .eq("transaction_id", confirmation.transaction_id)
    .single()

  return <DeliveryConfirmation confirmation={confirmation} shippingProof={shippingProof} />
}
