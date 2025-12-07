import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { EditLinkForm } from "@/components/seller/edit-link-form"

interface PageProps {
    params: Promise<{ shortCode: string }>
}

export default async function EditLinkPage({ params }: PageProps) {
    const { shortCode } = await params
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const { data: link } = await supabase
        .from("krowba_links")
        .select("*")
        .eq("short_code", shortCode)
        .single()

    if (!link) {
        notFound()
    }

    if (link.seller_id !== user.id) {
        redirect("/dashboard/links")
    }

    // Prevent editing if order is already delivered
    if (link.status === 'sold' && link.shipping_status === 'delivered') {
        redirect(`/dashboard/links/${shortCode}`)
    }

    return (
        <main className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-[#ededed]">Edit Link</h1>
                    <p className="text-gray-600 dark:text-gray-400">Update your product details and settings</p>
                </div>
                <EditLinkForm link={link} />
            </div>
        </main>
    )
}
