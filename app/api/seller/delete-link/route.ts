import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import crypto from "crypto"

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const linkId = searchParams.get("id")

        if (!linkId) {
            return NextResponse.json({ error: "Link ID is required" }, { status: 400 })
        }

        // 1. Fetch the link to verify ownership and get images
        const { data: link, error: fetchError } = await supabase
            .from("krowba_links")
            .select("*, items(*)")
            .eq("id", linkId)
            .single()

        if (fetchError || !link) {
            return NextResponse.json({ error: "Link not found" }, { status: 404 })
        }

        // Initialize admin client early for reliable lookups
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        console.log("[Delete Link] Starting seller lookup for user:", user.id)

        // Verify ownership (using admin client to bypass RLS on sellers table)
        // NOTE: sellers.id directly references auth.users(id), there is no user_id column
        const { data: seller, error: sellerError } = await supabaseAdmin
            .from("sellers")
            .select("id")
            .eq("id", user.id)  // Changed from user_id to id
            .single()

        console.log("[Delete Link] Seller lookup result:", {
            userId: user.id,
            sellerFound: !!seller,
            sellerId: seller?.id,
            sellerError: sellerError,
            linkSellerId: link.seller_id
        })

        if (sellerError) {
            console.error("[Delete Link] Seller query error:", sellerError)
            return NextResponse.json({
                error: `Database error: ${sellerError.message}`
            }, { status: 500 })
        }

        if (!seller) {
            console.error("[Delete Link] Seller profile not found for user:", user.id)
            return NextResponse.json({ error: "Seller profile not found. Please contact support." }, { status: 403 })
        }

        if (link.seller_id !== seller.id) {
            console.error("[Delete Link] Ownership mismatch:", {
                linkSellerId: link.seller_id,
                currentSellerId: seller.id,
                userId: user.id
            })
            return NextResponse.json({ error: "Unauthorized: You do not own this link" }, { status: 403 })
        }

        console.log("[Delete Link] Ownership verified, proceeding with deletion")

        // 2. Delete images from Cloudinary
        if (link.images && link.images.length > 0) {
            const cloudName = process.env.CLOUDINARY_CLOUD_NAME
            const apiKey = process.env.CLOUDINARY_API_KEY
            const apiSecret = process.env.CLOUDINARY_API_SECRET

            if (cloudName && apiKey && apiSecret) {
                for (const imageUrl of link.images) {
                    try {
                        // Extract public_id from URL
                        const regex = /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/
                        const match = imageUrl.match(regex)
                        if (match && match[1]) {
                            const publicId = match[1]

                            // Generate signature for destroy
                            const timestamp = Math.floor(Date.now() / 1000)
                            const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`
                            const signature = crypto
                                .createHash("sha256")
                                .update(paramsToSign + apiSecret)
                                .digest("hex")

                            const formData = new FormData()
                            formData.append("public_id", publicId)
                            formData.append("api_key", apiKey)
                            formData.append("timestamp", timestamp.toString())
                            formData.append("signature", signature)

                            await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
                                method: "POST",
                                body: formData,
                            })
                        }
                    } catch (err) {
                        console.error("Failed to delete image from Cloudinary:", err)
                        // Continue deleting the link even if image deletion fails
                    }
                }
            }
        }

        // 3. Delete related records (using admin client to bypass RLS)
        // Delete delivery confirmations
        await supabaseAdmin.from("delivery_confirmations").delete().eq("krowba_link_id", linkId)

        // Delete disputes
        await supabaseAdmin.from("disputes").delete().eq("krowba_link_id", linkId)

        // 4. Delete the link record
        const { error: deleteError } = await supabaseAdmin
            .from("krowba_links")
            .delete()
            .eq("id", linkId)

        if (deleteError) {
            console.error("Delete error details:", deleteError)
            throw deleteError
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error("Delete link error:", error)
        // Log detailed error info
        if (error instanceof Error) {
            console.error("Error message:", error.message)
            console.error("Error stack:", error.stack)
        } else {
            console.error("Unknown error object:", JSON.stringify(error))
        }

        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to delete link" },
            { status: 500 }
        )
    }
}
