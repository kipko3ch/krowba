import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/seller/dashboard-header"
import { LinkDetails } from "@/components/seller/link-details"

interface PageProps {
    params: Promise<{ shortCode: string }>
}

export default async function LinkDetailsPage({ params }: PageProps) {
    const { shortCode } = await params
    const supabase = await createClient()

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
        redirect("/login")
    }

    const { data: seller } = await supabase.from("sellers").select("*").eq("id", user.id).single()

    const { data: link } = await supabase
        .from("krowba_links")
        .select("*")
        .eq("short_code", shortCode)
        .eq("seller_id", user.id)
        .single()

    if (!link) {
        notFound()
    }

    // Fetch related transactions
    const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("krowba_link_id", link.id)
        .order("created_at", { ascending: false })

    // Fetch escrow holds
    const { data: escrowHolds } = await supabase.from("escrow_holds").select("*").eq("krowba_link_id", link.id)

    // Fetch shipping proofs
    const { data: shippingProofs } = await supabase.from("shipping_proofs").select("*").eq("krowba_link_id", link.id)

    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader seller={seller} />

            <main className="container mx-auto px-4 py-8">
                <LinkDetails
                    link={link}
                    transactions={transactions || []}
                    escrowHolds={escrowHolds || []}
                    shippingProofs={shippingProofs || []}
                />
            </main>
        </div>
    )
}
