import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { DashboardStats } from "@/components/seller/dashboard-stats"
import { LinksTable } from "@/components/seller/links-table"
import { Greeting } from "@/components/seller/greeting"
import { Plus, ArrowRight } from "lucide-react"

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
        redirect("/login")
    }

    const { data: seller } = await supabase
        .from("sellers")
        .select("business_name")
        .eq("id", user.id)
        .single()

    // Fetch seller's links
    const { data: links } = await supabase
        .from("krowba_links")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false })

    const allLinks = links || []


    return (
        <main className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="flex items-center justify-between mb-8">
                <Greeting name={seller?.business_name || "Seller"} />
                <Link href="/dashboard/create">
                    <Button className="bg-[#44f91f] hover:bg-[#3de018] text-black font-bold">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Link
                    </Button>
                </Link>
            </div>

            {/* Stats & Graph */}
            <DashboardStats links={allLinks} />

            {/* Recent Links */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-foreground">Recent Links</h2>
                    <Link href="/dashboard/links" className="text-sm text-primary hover:underline flex items-center">
                        View All <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                </div>

                <LinksTable links={allLinks.slice(0, 5)} />
            </div>
        </main>
    )
}
