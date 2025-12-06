import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
    try {
        const { shortCode, pin } = await request.json()
        const supabase = await createClient()

        // Fetch the link's PIN
        const { data: link } = await supabase
            .from("krowba_links")
            .select("access_pin")
            .eq("short_code", shortCode)
            .single()

        if (!link) {
            return NextResponse.json({ error: "Link not found" }, { status: 404 })
        }

        if (link.access_pin !== pin) {
            return NextResponse.json({ error: "Invalid PIN" }, { status: 401 })
        }

        // Set a cookie to authorize access
        const cookieStore = await cookies()
        cookieStore.set(`krowba_auth_${shortCode}`, "true", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24, // 24 hours
            path: "/",
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
