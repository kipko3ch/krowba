import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        console.log("Update Link Body:", body)
        const { link_id, item_name, item_price, delivery_fee, escrow_mode, deposit_amount, access_pin, images } = body

        // Verify ownership
        const { data: existingLink } = await supabase
            .from("krowba_links")
            .select("seller_id")
            .eq("id", link_id)
            .single()

        if (!existingLink || existingLink.seller_id !== user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Update link
        const { data: link, error: linkError } = await supabase
            .from("krowba_links")
            .update({
                item_name,
                item_price,
                delivery_fee,
                escrow_mode,
                deposit_amount,
                access_pin: access_pin ?? null, // Explicitly use null if undefined/null
                images,
                updated_at: new Date().toISOString(),
            })
            .eq("id", link_id)
            .select()
            .single()

        if (linkError) {
            console.error("Update Link Error:", linkError)
            return NextResponse.json({ error: "Failed to update link", details: linkError }, { status: 500 })
        }

        console.log("Update Link Success:", link)

        // Also update the item record
        // Note: In a real app we might want to update the item record too, but for now we focus on the link.
        // The link has copies of item data.

        return NextResponse.json({
            success: true,
            data: link,
        })
    } catch (error) {
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Internal server error",
            },
            { status: 500 },
        )
    }
}
