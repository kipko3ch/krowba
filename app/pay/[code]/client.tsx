"use client"

import { Button } from "@/components/ui/button"
import { Shield, ShieldCheck, Lock, CheckCircle2, Share2, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { CometCard } from "@/components/ui/comet-card"
import Image from "next/image"
import { useState } from "react"
import { toast } from "sonner"
import Link from "next/link"

interface LinkPageClientProps {
    link: {
        id: string
        short_code: string
        item_name: string
        item_price: number
        delivery_fee: number
        escrow_mode: string
        deposit_amount: number | null
        images: string[]
        status: string
        access_pin: string | null
        items?: {
            description?: string
        }
        seller?: {
            business_name: string
        } | null
    }
}

export function LinkPageClient({ link }: LinkPageClientProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [pin, setPin] = useState("")
    const [pinError, setPinError] = useState(false)
    const [unlocked, setUnlocked] = useState(!link.access_pin)

    const totalPrice = link.item_price + link.delivery_fee
    const depositAmount = link.escrow_mode === "split_risk" ? link.deposit_amount || link.delivery_fee : totalPrice

    const handleUnlock = () => {
        if (pin === link.access_pin) {
            setUnlocked(true)
        } else {
            setPinError(true)
            setTimeout(() => setPinError(false), 1500)
        }
    }

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href)
        toast.success("Link copied to clipboard")
    }

    if (!unlocked) {
        return (
            <div className="min-h-dvh bg-background flex items-center justify-center p-4">
                <div className="max-w-sm w-full space-y-6 text-center">
                    <div className="bg-card border border-border rounded-2xl p-8 shadow-lg space-y-6">
                        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
                            <Lock className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-serif-display font-bold">Protected Link</h1>
                            <p className="text-sm text-muted-foreground mt-2">Enter the PIN shared by the seller</p>
                        </div>
                        <input
                            type="text"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="Enter PIN"
                            className={cn(
                                "w-full h-14 text-center text-2xl tracking-[0.5em] rounded-xl border bg-background text-foreground placeholder:text-muted-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary transition-all",
                                pinError ? "border-destructive animate-shake" : "border-border"
                            )}
                        />
                        <Button onClick={handleUnlock} className="w-full h-12 bg-primary hover:bg-primary/90 text-black font-semibold">
                            Unlock
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-dvh bg-background font-[family-name:var(--font-roboto)]">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="font-serif-display text-xl tracking-wide group-hover:text-primary transition-colors">krowba</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={copyLink}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                        >
                            <Share2 className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">Escrow Protected</span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-12 items-start">

                    {/* Left: Product Image */}
                    <div className="space-y-4">
                        <CometCard className="w-full" rotateDepth={8} translateDepth={12}>
                            <div className="relative aspect-square bg-card border border-border rounded-3xl overflow-hidden shadow-2xl group">
                                {link.images?.[currentImageIndex] ? (
                                    <Image
                                        src={link.images[currentImageIndex]}
                                        alt={link.item_name}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        priority
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground bg-muted">
                                        <span className="text-sm">No image</span>
                                    </div>
                                )}

                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-90" />

                                {/* Product Info Overlay */}
                                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                                    <h2 className="font-bold text-2xl text-white truncate drop-shadow-md">{link.item_name}</h2>
                                    <p className="text-white/90 font-medium text-lg mt-1 drop-shadow-md">KES {Number(link.item_price).toLocaleString()}</p>
                                </div>
                            </div>
                        </CometCard>

                        {/* Thumbnails */}
                        {link.images && link.images.length > 1 && (
                            <div className="flex gap-2">
                                {link.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={cn(
                                            "w-14 h-14 rounded-md overflow-hidden border transition-all",
                                            idx === currentImageIndex
                                                ? "border-foreground ring-2 ring-foreground/20"
                                                : "border-border opacity-50 hover:opacity-100"
                                        )}
                                    >
                                        <Image src={img} alt="" width={56} height={56} className="object-cover w-full h-full" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Product Details */}
                    <div className="space-y-6">
                        {/* Title & Description */}
                        <div className="space-y-3">
                            <h1 className="text-3xl font-serif-display font-bold leading-tight">
                                {link.item_name}
                            </h1>

                            {link.items?.description && (
                                <p className="text-muted-foreground leading-relaxed">
                                    {link.items.description}
                                </p>
                            )}
                        </div>

                        {/* Price */}
                        <div className="text-2xl font-bold">
                            KES {totalPrice.toLocaleString()}
                        </div>

                        {/* Escrow Protection */}
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                            <div className="flex items-center gap-2 text-primary">
                                <ShieldCheck className="w-5 h-5" />
                                <span className="font-semibold text-sm">
                                    {link.escrow_mode === "full_escrow" ? "Full Escrow Protection" : "Deposit Protection"}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {link.escrow_mode === "full_escrow"
                                    ? "Payment held securely until delivery confirmed."
                                    : `Pay ${depositAmount?.toLocaleString()} KES deposit now, rest on delivery.`
                                }
                            </p>
                        </div>

                        {/* CTA Button */}
                        <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-black font-semibold rounded-lg">
                            Pay {depositAmount?.toLocaleString()} KES
                        </Button>

                        {/* Seller Info */}
                        <div className="pt-4 border-t border-border">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                    <User className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <span className="font-medium text-sm">{link.seller?.business_name || "Seller"}</span>
                                    <div className="text-xs text-muted-foreground">Verified Seller</div>
                                </div>
                            </div>
                        </div>

                        {/* Trust Badges */}
                        <div className="flex items-center gap-6 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <Shield className="w-4 h-4" />
                                <span>Buyer Protection</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Lock className="w-4 h-4" />
                                <span>Secure Payment</span>
                            </div>
                        </div>

                        {/* Social Share */}
                        <div className="pt-6 border-t border-border">
                            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Share this link</p>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" className="rounded-full h-10 w-10 hover:bg-[#25D366] hover:text-white transition-colors" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(window.location.href)}`, '_blank')}>
                                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                </Button>
                                <Button variant="outline" size="icon" className="rounded-full h-10 w-10 hover:bg-black hover:text-white transition-colors" onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`, '_blank')}>
                                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                </Button>
                                <Button variant="outline" size="icon" className="rounded-full h-10 w-10 hover:bg-black hover:text-white transition-colors" onClick={() => window.open(`https://www.tiktok.com/share?url=${encodeURIComponent(window.location.href)}`, '_blank')}>
                                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
                                </Button>
                                <Button variant="outline" size="icon" className="rounded-full h-10 w-10 hover:bg-pink-600 hover:text-white transition-colors" onClick={() => window.open(`https://www.instagram.com/`, '_blank')}>
                                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
