import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/seller/dashboard-header"

export default async function SellerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
        redirect("/login")
    }

    // Fetch seller profile for the header
    const { data: seller } = await supabase.from("sellers").select("*").eq("id", user.id).single()

    return (
        <div className="min-h-screen bg-background font-sans">
            <DashboardHeader seller={seller} />
            {children}
        </div>
    )
}
