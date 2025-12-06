"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
    ShieldCheck,
    Lock,
    Truck,
    CreditCard,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ArrowRight,
    Package,
    MapPin,
    Clock,
    XCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PaymentPageClientProps {
    link: any
}

export default function PaymentPageClient({ link }: PaymentPageClientProps) {
    const router = useRouter()
    const [accessPin, setAccessPin] = useState("")
    const [isUnlocked, setIsUnlocked] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState("")
    const [selectedImage, setSelectedImage] = useState(0)

    // Order Status State (for post-payment view)
    const [orderStatus, setOrderStatus] = useState(link.shipping_status || 'pending')
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

    const isSold = link.status === 'sold'

    // Auto-unlock if no PIN is set (legacy links)
    useEffect(() => {
        if (!link.access_pin) {
            setIsUnlocked(true)
        }
    }, [link.access_pin])

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault()
        if (accessPin === link.access_pin) {
            setIsUnlocked(true)
            setError("")
            toast.success("Access granted")
        } else {
            setError("Incorrect PIN. Please try again.")
            toast.error("Incorrect PIN")
        }
    }

    const handlePayNow = async () => {
        setIsProcessing(true)
        try {
            const response = await fetch("/api/buyer/initiate-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    linkId: link.id,
                    amount: link.item_price + link.delivery_fee, // Full amount for now
                    email: "buyer@example.com", // TODO: Collect buyer email if not in link
                }),
            })

            const data = await response.json()

            if (!response.ok) throw new Error(data.error || "Payment initiation failed")

            // Redirect to Paystack
            window.location.href = data.authorization_url
        } catch (error) {
            console.error("Payment error:", error)
            toast.error("Failed to initiate payment. Please try again.")
            setIsProcessing(false)
        }
    }

    const handleConfirmDelivery = async () => {
        if (!confirm("Are you sure you have received the item? This will release funds to the seller.")) return;

        setIsUpdatingStatus(true)
        try {
            const response = await fetch("/api/orders/update-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    linkId: link.id,
                    status: 'delivered',
                    action: 'confirm_delivery'
                }),
            })

            if (!response.ok) throw new Error("Failed to confirm delivery")

            setOrderStatus('delivered')

            // Dynamic import for confetti to avoid SSR issues
            const confetti = (await import("canvas-confetti")).default
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            })
            toast.success("Delivery confirmed! Funds released.")
        } catch (error) {
            toast.error("Failed to confirm delivery")
        } finally {
            setIsUpdatingStatus(false)
        }
    }

    // PIN Entry View
    if (!isUnlocked) {
        return (
            <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#f8f9fa] p-4 font-sans">
                <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black text-white mb-4 shadow-xl">
                            <Lock className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-serif font-medium tracking-tight">Private Link</h1>
                        <p className="text-muted-foreground">Enter the PIN provided by the seller to view this item.</p>
                    </div>

                    <form onSubmit={handleUnlock} className="bg-white p-8 rounded-3xl shadow-2xl shadow-black/5 border border-black/5 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Security PIN</Label>
                            <Input
                                type="password"
                                value={accessPin}
                                onChange={(e) => setAccessPin(e.target.value)}
                                className="text-center text-2xl tracking-[1em] h-16 font-mono bg-muted/30 border-2 focus:border-black focus:ring-0 transition-all rounded-xl"
                                placeholder="••••"
                                maxLength={4}
                                autoFocus
                            />
                            {error && <p className="text-sm text-destructive text-center font-medium">{error}</p>}
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-14 text-lg font-medium rounded-xl bg-black hover:bg-black/90 text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Unlock Access
                        </Button>
                    </form>

                    <div className="text-center">
                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Secured by Krowba Escrow
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    // Main Payment/Order View
    return (
        <div className="min-h-screen bg-[#f8f9fa] font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="font-serif font-bold text-xl tracking-tight">krowba</span>
                    </div>
                    <div className="text-xs font-medium px-3 py-1 bg-black/5 rounded-full text-muted-foreground">
                        {isSold ? 'Order Tracking' : 'Secure Checkout'}
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">

                    {/* Left Column: Product Visuals */}
                    <div className="space-y-6 lg:sticky lg:top-24">
                        <div className="aspect-square relative rounded-3xl overflow-hidden shadow-2xl shadow-black/5 bg-white">
                            {link.images && link.images.length > 0 ? (
                                <Image
                                    src={link.images[selectedImage]}
                                    alt={link.item_name}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted">
                                    <Package className="w-16 h-16 text-muted-foreground/30" />
                                </div>
                            )}

                            {/* Status Badge Overlay */}
                            {isSold && (
                                <div className="absolute top-4 right-4 px-4 py-2 bg-black/80 backdrop-blur text-white text-sm font-medium rounded-full flex items-center gap-2">
                                    {orderStatus === 'delivered' ? (
                                        <><CheckCircle2 className="w-4 h-4 text-primary" /> Delivered</>
                                    ) : (
                                        <><Clock className="w-4 h-4 text-primary" /> {orderStatus === 'shipped' ? 'In Transit' : 'Processing'}</>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {link.images && link.images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                {link.images.map((img: string, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(idx)}
                                        className={cn(
                                            "relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all",
                                            selectedImage === idx ? "border-black ring-2 ring-black/10" : "border-transparent opacity-70 hover:opacity-100"
                                        )}
                                    >
                                        <Image src={img} alt="" fill className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Details & Action */}
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-4xl sm:text-5xl font-serif font-medium leading-[1.1] mb-4 text-gray-900">
                                {link.item_name}
                            </h1>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                {link.description || "No description provided."}
                            </p>
                        </div>

                        {/* Price Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-xl shadow-black/5 border border-black/5 space-y-4">
                            <div className="flex justify-between items-baseline pb-4 border-b border-dashed">
                                <span className="text-muted-foreground font-medium">Total Price</span>
                                <span className="text-3xl font-bold font-serif">
                                    KES {(link.item_price + link.delivery_fee).toLocaleString()}
                                </span>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Item Cost</span>
                                    <span>KES {link.item_price.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Delivery Fee</span>
                                    <span>KES {link.delivery_fee.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Section */}
                        {!isSold ? (
                            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700 delay-200">
                                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                        <ShieldCheck className="w-5 h-5 text-primary-dark" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Protected by Krowba Escrow</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Your money is held safely until you confirm delivery. The seller doesn't get paid until you're happy.
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    onClick={handlePayNow}
                                    disabled={isProcessing}
                                    className="w-full h-16 text-lg font-semibold rounded-2xl bg-black hover:bg-black/90 text-white shadow-lg shadow-black/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Redirecting to Paystack...
                                        </>
                                    ) : (
                                        <>
                                            Pay Securely
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </>
                                    )}
                                </Button>

                                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                    <Lock className="w-3 h-3" />
                                    <span>256-bit SSL Encrypted Payment via Paystack</span>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
                                {/* Order Tracking UI */}
                                <div className="bg-white border border-black/5 rounded-2xl p-6 shadow-lg shadow-black/5">
                                    <h3 className="font-serif text-xl font-medium mb-6">Order Status</h3>

                                    <div className="relative space-y-8 pl-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                                        {/* Step 1: Paid */}
                                        <div className="relative">
                                            <div className="absolute -left-[35px] w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-white shadow-sm">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-medium">Payment Confirmed</p>
                                                <p className="text-sm text-muted-foreground">Funds held in escrow</p>
                                            </div>
                                        </div>

                                        {/* Step 2: Shipped */}
                                        <div className="relative">
                                            <div className={cn(
                                                "absolute -left-[35px] w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm",
                                                ['shipped', 'delivered'].includes(orderStatus) ? "bg-primary" : "bg-muted"
                                            )}>
                                                {['shipped', 'delivered'].includes(orderStatus) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                            <div>
                                                <p className={cn("font-medium", !['shipped', 'delivered'].includes(orderStatus) && "text-muted-foreground")}>
                                                    Shipped
                                                </p>
                                                {orderStatus === 'shipped' && (
                                                    <p className="text-sm text-primary font-medium animate-pulse">In Transit...</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Step 3: Delivered */}
                                        <div className="relative">
                                            <div className={cn(
                                                "absolute -left-[35px] w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm",
                                                orderStatus === 'delivered' ? "bg-primary" : "bg-muted"
                                            )}>
                                                {orderStatus === 'delivered' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                            <div>
                                                <p className={cn("font-medium", orderStatus !== 'delivered' && "text-muted-foreground")}>
                                                    Delivered
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Buyer Actions */}
                                {orderStatus === 'shipped' && (
                                    <div className="space-y-3">
                                        <Button
                                            onClick={handleConfirmDelivery}
                                            disabled={isUpdatingStatus}
                                            className="w-full h-14 bg-primary hover:bg-primary/90 text-black font-semibold rounded-xl text-lg shadow-lg shadow-primary/20"
                                        >
                                            {isUpdatingStatus ? <Loader2 className="animate-spin" /> : "I Have Received the Item"}
                                        </Button>
                                        <p className="text-xs text-center text-muted-foreground">
                                            Clicking this releases the funds to the seller immediately.
                                        </p>
                                    </div>
                                )}

                                {orderStatus === 'delivered' && (
                                    <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                                        <p className="text-green-800 font-medium">Transaction Completed</p>
                                        <p className="text-sm text-green-600">Thank you for using Krowba!</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
