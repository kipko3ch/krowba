"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, ShieldCheck, Lock, Share2, User, Loader2, ArrowLeft, Check } from "lucide-react"
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

// Payment method type
type PaymentMethod = "card" | "mpesa" | "bank"

export function LinkPageClient({ link }: LinkPageClientProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [pin, setPin] = useState("")
    const [pinError, setPinError] = useState(false)
    const [unlocked, setUnlocked] = useState(!link.access_pin)

    // Payment state
    const [showCheckout, setShowCheckout] = useState(false)
    const [buyerName, setBuyerName] = useState("")
    const [buyerEmail, setBuyerEmail] = useState("")
    const [buyerPhone, setBuyerPhone] = useState("")
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card")
    const [isProcessing, setIsProcessing] = useState(false)

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

    const handlePayNow = async () => {
        if (!buyerEmail) {
            toast.error("Please enter your email address")
            return
        }

        if (!buyerEmail.includes("@")) {
            toast.error("Please enter a valid email address")
            return
        }

        setIsProcessing(true)

        try {
            const response = await fetch("/api/buyer/pay", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    link_id: link.id,
                    buyer_name: buyerName,
                    buyer_email: buyerEmail,
                    buyer_phone: buyerPhone,
                    amount: depositAmount,
                    payment_type: link.escrow_mode === "split_risk" ? "deposit" : "full",
                }),
            })

            const result = await response.json()

            if (!response.ok || !result.success) {
                throw new Error(result.error || "Payment initiation failed")
            }

            // Redirect to Paystack checkout
            if (result.data?.authorization_url) {
                window.location.href = result.data.authorization_url
            } else {
                throw new Error("No payment URL received")
            }
        } catch (error) {
            console.error("Payment error:", error)
            toast.error(error instanceof Error ? error.message : "Payment failed. Please try again.")
            setIsProcessing(false)
        }
    }

    // PIN unlock screen
    if (!unlocked) {
        return (
            <div className="min-h-dvh bg-background flex items-center justify-center p-4">
                <div className="max-w-sm w-full space-y-6 text-center">
                    <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6">
                        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
                            <Lock className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Protected Link</h1>
                            <p className="text-sm text-muted-foreground mt-2">Enter the PIN shared by the seller</p>
                        </div>
                        <Input
                            type="text"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="Enter PIN"
                            className={cn(
                                "h-14 text-center text-2xl tracking-widest rounded-xl",
                                pinError && "border-destructive animate-shake"
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

    // CHECKOUT PAGE - Full page Stripe-style
    if (showCheckout) {
        return (
            <div className="min-h-dvh bg-zinc-50 dark:bg-zinc-950">
                {/* Header */}
                <header className="bg-background border-b border-border sticky top-0 z-50">
                    <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
                        <button
                            onClick={() => setShowCheckout(false)}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Back to product</span>
                        </button>
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <span className="font-semibold text-lg">krowba</span>
                        </Link>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Lock className="w-3 h-3" />
                            <span className="hidden sm:inline">Secured</span>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-4xl mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">

                        {/* Left: Payment Form */}
                        <div className="space-y-6">
                            {/* Order Summary - Mobile Only */}
                            <div className="lg:hidden bg-background border border-border rounded-xl p-4">
                                <div className="flex items-center gap-4">
                                    {link.images?.[0] && (
                                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                            <Image src={link.images[0]} alt="" width={64} height={64} className="object-cover w-full h-full" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{link.item_name}</p>
                                        <p className="text-lg font-bold text-primary">KES {depositAmount?.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Your Details */}
                            <div className="bg-background border border-border rounded-xl p-6">
                                <h2 className="text-lg font-semibold mb-5">Your Details</h2>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-sm">Full Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="John Doe"
                                            value={buyerName}
                                            onChange={(e) => setBuyerName(e.target.value)}
                                            className="h-12"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-sm">Email Address <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={buyerEmail}
                                            onChange={(e) => setBuyerEmail(e.target.value)}
                                            required
                                            className="h-12"
                                        />
                                        <p className="text-xs text-muted-foreground">Payment receipt will be sent here</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-sm">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="+254 7XX XXX XXX"
                                            value={buyerPhone}
                                            onChange={(e) => setBuyerPhone(e.target.value)}
                                            className="h-12"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="bg-background border border-border rounded-xl p-6">
                                <h2 className="text-lg font-semibold mb-5">Payment Method</h2>

                                <div className="space-y-3">
                                    {/* Card Option */}
                                    <button
                                        type="button"
                                        onClick={() => setSelectedMethod("card")}
                                        className={cn(
                                            "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                                            selectedMethod === "card"
                                                ? "border-primary bg-primary/5"
                                                : "border-border hover:border-muted-foreground/30"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                                            selectedMethod === "card" ? "border-primary bg-primary" : "border-muted-foreground/40"
                                        )}>
                                            {selectedMethod === "card" && <Check className="w-3 h-3 text-black" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">Card</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">Visa, Mastercard, Verve</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Visa */}
                                            <div className="h-6 w-10 bg-white border rounded flex items-center justify-center p-1">
                                                <svg viewBox="0 0 32 10" className="w-full h-full">
                                                    <path fill="#1434CB" d="M12.7.2L8.6 24.6h4.1l4.1-24.4h-4.1zm18.8 0l-2.6 17.6c-.2.8-1.3 1.6-2.4 1.6h-8.3l-.1-.6L23.4.2h9.1l-1 0zm-14.7 0H12l-2.5 15.6c-.3 1.3-1.8 2.2-3.1 2.2H.4l-.2.9c3.9 1 8.3 1.8 11.9 1.8 4.4 0 7.3-2.1 8.2-6.6L24.6.2h-7.8z" />
                                                </svg>
                                            </div>
                                            {/* Mastercard */}
                                            <div className="h-6 w-10 bg-white border rounded flex items-center justify-center p-1">
                                                <svg viewBox="0 0 24 18" className="w-full h-full">
                                                    <circle cx="7" cy="9" r="7" fill="#EB001B" />
                                                    <circle cx="17" cy="9" r="7" fill="#F79E1B" />
                                                    <path d="M12 4.5c1.5 1.2 2.5 3 2.5 4.5s-1 3.3-2.5 4.5c-1.5-1.2-2.5-3-2.5-4.5s1-3.3 2.5-4.5z" fill="#FF5F00" />
                                                </svg>
                                            </div>
                                        </div>
                                    </button>

                                    {/* M-Pesa Option */}
                                    <button
                                        type="button"
                                        onClick={() => setSelectedMethod("mpesa")}
                                        className={cn(
                                            "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                                            selectedMethod === "mpesa"
                                                ? "border-primary bg-primary/5"
                                                : "border-border hover:border-muted-foreground/30"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                                            selectedMethod === "mpesa" ? "border-primary bg-primary" : "border-muted-foreground/40"
                                        )}>
                                            {selectedMethod === "mpesa" && <Check className="w-3 h-3 text-black" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">M-Pesa</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">Pay via Safaricom</p>
                                        </div>
                                        <div className="h-6 px-2 bg-[#43B02A] rounded flex items-center justify-center">
                                            <span className="text-white text-[10px] font-bold tracking-wider">M-PESA</span>
                                        </div>
                                    </button>

                                    {/* Bank Transfer Option */}
                                    <button
                                        type="button"
                                        onClick={() => setSelectedMethod("bank")}
                                        className={cn(
                                            "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                                            selectedMethod === "bank"
                                                ? "border-primary bg-primary/5"
                                                : "border-border hover:border-muted-foreground/30"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                                            selectedMethod === "bank" ? "border-primary bg-primary" : "border-muted-foreground/40"
                                        )}>
                                            {selectedMethod === "bank" && <Check className="w-3 h-3 text-black" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">Bank Transfer</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">Direct bank payment</p>
                                        </div>
                                        <div className="h-6 w-10 bg-muted rounded flex items-center justify-center">
                                            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                                            </svg>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Pay Button */}
                            <Button
                                onClick={handlePayNow}
                                disabled={isProcessing}
                                className="w-full h-14 bg-primary hover:bg-primary/90 text-black font-semibold text-base rounded-xl"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>Pay KES {depositAmount?.toLocaleString()}</>
                                )}
                            </Button>

                            {/* Security Notice */}
                            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                <Lock className="w-3.5 h-3.5" />
                                <span>Secured by Paystack • 256-bit SSL encryption</span>
                            </div>
                        </div>

                        {/* Right: Order Summary - Desktop */}
                        <div className="hidden lg:block">
                            <div className="sticky top-20 space-y-4">
                                <div className="bg-background border border-border rounded-xl p-6">
                                    <h2 className="text-lg font-semibold mb-5">Order Summary</h2>

                                    {/* Product */}
                                    <div className="flex gap-4 pb-5 border-b border-border">
                                        {link.images?.[0] ? (
                                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                                <Image src={link.images[0]} alt="" width={80} height={80} className="object-cover w-full h-full" />
                                            </div>
                                        ) : (
                                            <div className="w-20 h-20 rounded-lg bg-muted flex-shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium line-clamp-2">{link.item_name}</p>
                                            <p className="text-sm text-muted-foreground mt-1">Seller: {link.seller?.business_name || "Verified Seller"}</p>
                                        </div>
                                    </div>

                                    {/* Price Breakdown */}
                                    <div className="space-y-3 py-5 border-b border-border">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Item Price</span>
                                            <span>KES {Number(link.item_price).toLocaleString()}</span>
                                        </div>
                                        {link.delivery_fee > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Delivery</span>
                                                <span>KES {Number(link.delivery_fee).toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Total */}
                                    <div className="flex justify-between pt-5">
                                        <span className="font-semibold">
                                            {link.escrow_mode === "split_risk" ? "Deposit Due" : "Total"}
                                        </span>
                                        <span className="text-xl font-bold text-primary">KES {depositAmount?.toLocaleString()}</span>
                                    </div>

                                    {link.escrow_mode === "split_risk" && (
                                        <p className="text-xs text-muted-foreground mt-2">
                                            + KES {(totalPrice - (depositAmount || 0)).toLocaleString()} on delivery
                                        </p>
                                    )}
                                </div>

                                {/* Escrow Protection Card */}
                                <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
                                    <div className="flex gap-3">
                                        <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-sm">Your payment is protected</p>
                                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                                Funds are held securely until you confirm delivery. If something goes wrong, you're covered.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    // PRODUCT PAGE
    return (
        <div className="min-h-dvh bg-background">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="font-serif-display text-xl tracking-wide group-hover:text-primary transition-colors">krowba</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={copyLink}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            aria-label="Share link"
                        >
                            <Share2 className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <Link
                            href="/login"
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
                        >
                            <User className="w-4 h-4" />
                            <span>Login</span>
                        </Link>
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">Escrow Protected</span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative">
                {/* Background Blur Effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-96 bg-primary/10 blur-[100px] -z-10 rounded-full pointer-events-none" />

                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] lg:grid-cols-[400px_1fr] gap-8 lg:gap-12 items-start">

                    {/* Left: Product Image */}
                    <div className="space-y-4">
                        <CometCard className="w-full" rotateDepth={8} translateDepth={12}>
                            <div className="relative aspect-square bg-card border border-border rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl group">
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
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                {/* Product Info Overlay */}
                                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                                    <h2 className="font-bold text-xl sm:text-2xl text-white truncate">{link.item_name}</h2>
                                    <p className="text-white/90 font-medium text-lg mt-1">KES {Number(link.item_price).toLocaleString()}</p>
                                </div>
                            </div>
                        </CometCard>

                        {/* Thumbnails */}
                        {link.images && link.images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {link.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={cn(
                                            "w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                                            idx === currentImageIndex
                                                ? "border-primary ring-2 ring-primary/20"
                                                : "border-transparent opacity-60 hover:opacity-100"
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
                            <h1 className="text-3xl sm:text-4xl font-serif-display font-bold leading-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
                                {link.item_name}
                            </h1>

                            {link.items?.description && (
                                <p className="text-muted-foreground leading-relaxed">
                                    {link.items.description}
                                </p>
                            )}
                        </div>

                        {/* Price Breakdown */}
                        <div className="space-y-2 p-4 bg-muted/50 rounded-xl">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Item Price</span>
                                <span>KES {Number(link.item_price).toLocaleString()}</span>
                            </div>
                            {link.delivery_fee > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Delivery Fee</span>
                                    <span>KES {Number(link.delivery_fee).toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                                <span>Total</span>
                                <span>KES {totalPrice.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Escrow Protection */}
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
                            <div className="flex items-center gap-2 text-primary">
                                <ShieldCheck className="w-5 h-5" />
                                <span className="font-semibold text-sm">
                                    {link.escrow_mode === "full_escrow" ? "Full Escrow Protection" : "Deposit Protection"}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {link.escrow_mode === "full_escrow"
                                    ? "Your payment is held securely until you confirm delivery. 100% buyer protection."
                                    : `Pay KES ${depositAmount?.toLocaleString()} deposit now. The rest on delivery.`
                                }
                            </p>
                        </div>

                        {/* CTA Button */}
                        <Button
                            onClick={() => setShowCheckout(true)}
                            className="w-full h-14 bg-primary hover:bg-primary/90 text-black font-semibold text-base rounded-xl"
                        >
                            {link.escrow_mode === "split_risk"
                                ? `Pay KES ${depositAmount?.toLocaleString()} Deposit`
                                : `Pay KES ${totalPrice.toLocaleString()}`
                            }
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
                                <Button variant="outline" size="icon" className="rounded-full h-10 w-10 hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-colors" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(window.location.href)}`, '_blank')}>
                                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                </Button>
                                <Button variant="outline" size="icon" className="rounded-full h-10 w-10 hover:bg-black hover:text-white hover:border-black transition-colors" onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`, '_blank')}>
                                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                </Button>
                                <Button variant="outline" size="icon" className="rounded-full h-10 w-10 hover:bg-black hover:text-white hover:border-black transition-colors" onClick={() => window.open(`https://www.tiktok.com/share?url=${encodeURIComponent(window.location.href)}`, '_blank')}>
                                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
