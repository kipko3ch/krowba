import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import LinkPageClient from "./client"

interface Props {
    params: Promise<{ code: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { code } = await params
    const supabase = await createClient()

    try {
        const { data: link, error } = await supabase
            .from("krowba_links")
            .select("item_name, images")
            .eq("short_code", code)
            .single()

        if (error) {
            console.error("Metadata fetch error:", error)
            return { title: "Krowba Secure Payment" }
        }

        if (!link) {
            return { title: "Link Not Found | Krowba" }
        }

        return {
            title: `${link.item_name} | Krowba`,
            description: `View and purchase ${link.item_name} securely on Krowba`,
            openGraph: {
                title: link.item_name,
                images: link.images?.[0] ? [link.images[0]] : [],
            },
        }
    } catch (err) {
        console.error("Metadata generation error:", err)
        return { title: "Krowba Secure Payment" }
    }
}

export default async function LinkPage({ params }: Props) {
    const { code } = await params
    const supabase = await createClient()

    // Fetch link first
    const { data: link, error: linkError } = await supabase
        .from("krowba_links")
        .select("*")
        .eq("short_code", code)
        .single()

    if (linkError) {
        console.error("Error fetching link:", linkError)
    }

    if (!link) {
        notFound()
    }

    // Fetch item details (description) separately
    let itemDescription = ""
    if (link.item_id) {
        const { data: item, error: itemError } = await supabase
            .from("items")
            .select("description")
            .eq("id", link.item_id)
            .single()

        if (!itemError && item) {
            itemDescription = item.description
        }
    }

    // Fetch seller details
    let sellerDetails = null
    if (link.seller_id) {
        const { data: seller, error: sellerError } = await supabase
            .from("sellers")
            .select("business_name")
            .eq("id", link.seller_id)
            .single()

        if (sellerError) {
            console.error("Error fetching seller:", sellerError)
        }

        if (seller) {
            console.log("Seller data fetched:", seller)
            sellerDetails = seller
        } else {
            console.log("No seller found for seller_id:", link.seller_id)
        }
    } else {
        console.log("No seller_id on link")
    }

    // Fetch transaction for this link (if exists)
    let transactionData = null
    let deliveryConfirmation = null
    if (link.status === 'sold') {
        const { data: transaction, error: txError } = await supabase
            .from("transactions")
            .select("*")
            .eq("krowba_link_id", link.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single()

        if (!txError && transaction) {
            transactionData = transaction

            // Fetch delivery confirmation if exists
            const { data: confirmation } = await supabase
                .from("delivery_confirmations")
                .select("*")
                .eq("transaction_id", transaction.id)
                .single()

            if (confirmation) {
                deliveryConfirmation = confirmation
            }
        }
    }

    // Construct the object expected by client
    const linkWithDetails = {
        ...link,
        items: {
            description: itemDescription
        },
        seller: sellerDetails,
        transaction_id: transactionData?.id || null,
        confirmation_id: deliveryConfirmation?.id || null,
    }

    return <LinkPageClient link={linkWithDetails} />
}
