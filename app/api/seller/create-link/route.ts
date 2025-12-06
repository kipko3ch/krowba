import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function generateShortCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let result = ""
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { item_name, description, item_price, delivery_fee, escrow_mode, deposit_amount, images, access_pin, buyer_name, buyer_email, buyer_phone } = body
    const seller_id = user.id

    // Validate required fields
    if (!item_name || !item_price || !images || images.length === 0 || !access_pin) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate unique short code
    let shortCode = generateShortCode()
    let attempts = 0
    while (attempts < 5) {
      const { data: existing } = await supabase.from("krowba_links").select("id").eq("short_code", shortCode).single()

      if (!existing) break
      shortCode = generateShortCode()
      attempts++
    }

    // First, create an item record
    const { data: item, error: itemError } = await supabase
      .from("items")
      .insert({
        seller_id,
        name: item_name,
        description: description || null,
        price: item_price,
        delivery_fee: delivery_fee || 0,
        images,
        status: "active",
      })
      .select()
      .single()

    if (itemError) {
      console.error("Item creation error:", itemError)
      return NextResponse.json({ error: "Failed to create item", details: itemError }, { status: 500 })
    }

    // Create the Krowba link
    const { data: link, error: linkError } = await supabase
      .from("krowba_links")
      .insert({
        seller_id,
        item_id: item.id,
        short_code: shortCode,
        item_name,
        item_price,
        delivery_fee: delivery_fee || 0,
        escrow_mode,
        deposit_amount: escrow_mode === "split_risk" ? deposit_amount || delivery_fee || 0 : null,
        access_pin: body.access_pin || null,
        buyer_name: buyer_name || null,
        buyer_email: buyer_email || null,
        buyer_phone: buyer_phone || null,
        images,
        ai_verification_status: "pending",
        status: "active",
      })
      .select()
      .single()

    if (linkError) {
      console.error("Link creation error:", linkError)
      // Rollback item creation if link creation fails (optional but good practice, though hard with just client)
      // For now just report error
      return NextResponse.json({ error: "Failed to create link", details: linkError }, { status: 500 })
    }

    // Trigger AI verification asynchronously (don't await)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (appUrl) {
      try {
        fetch(`${appUrl}/api/ai/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            link_id: link.id,
            images,
            item_name,
            description,
          }),
        }).catch((err) => console.error("AI trigger fetch error:", err))
      } catch (err) {
        console.error("AI trigger sync error:", err)
      }
    } else {
      console.warn("Skipping AI verification: NEXT_PUBLIC_APP_URL not set")
    }

    return NextResponse.json({
      success: true,
      data: link,
    })
  } catch (error) {
    console.error("Create link error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
        details: error
      },
      { status: 500 },
    )
  }
}
