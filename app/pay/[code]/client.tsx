"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
    XCircle,
    Sun,
    Moon,
    AlertTriangle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { CometCard } from "@/components/ui/comet-card"
import { useTheme } from "next-themes"
import { ImageUploader } from "@/components/seller/image-uploader"

interface PaymentPageClientProps {
    link: any
}

export default function PaymentPageClient({ link }: PaymentPageClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { theme, setTheme } = useTheme()
    const [accessPin, setAccessPin] = useState("")
    const [isUnlocked, setIsUnlocked] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState("")
    const [selectedImage, setSelectedImage] = useState(0)
    const [buyerName, setBuyerName] = useState("")
    const [buyerPhone, setBuyerPhone] = useState("")
    const [buyerEmail, setBuyerEmail] = useState("")

    // Order Status State (for post-payment view)
    const [orderStatus, setOrderStatus] = useState(link.shipping_status || 'pending')
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

    // 3-Button Confirmation Flow State
    const [selectedAction, setSelectedAction] = useState<null | "reject" | "not-received">(null)
    const [issueDescription, setIssueDescription] = useState("")
    const [evidencePhotos, setEvidencePhotos] = useState<string[]>([])

    // Check if sold or if returned from successful payment
    const isSold = link.status === 'sold' || searchParams.get('status') === 'success'

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
            const response = await fetch("/api/buyer/pay", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    link_id: link.id,
                    amount: link.item_price + link.delivery_fee,
                    buyer_email: buyerEmail,
                    buyer_name: buyerName,
                    buyer_phone: buyerPhone,
                    payment_type: "one_time"
                }),
            })

            const data = await response.json()

            if (!response.ok) throw new Error(data.error || "Payment initiation failed")

            // Redirect to Paystack
            window.location.href = data.data.authorization_url
        } catch (error) {
            console.error("Payment error:", error)
            toast.error("Failed to initiate payment. Please try again.")
            setIsProcessing(false)
        }
    }

    const handleConfirmDelivery = async () => {
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

            toast.success("Delivery confirmed! Funds released to seller.")
        } catch (error) {
            toast.error("Failed to confirm delivery. Please try again.")
        } finally {
            setIsUpdatingStatus(false)
        }
    }

    const handleRejectItem = async () => {
        if (!issueDescription.trim()) {
            toast.error("Please describe the issue")
            return
        }

        setIsUpdatingStatus(true)
        try {
            // Save evidence
            const evidenceResponse = await fetch("/api/delivery/reject", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    confirmation_id: link.id,
                    reason: issueDescription,
                    evidence_photos: evidencePhotos,
                }),
            })

            if (!evidenceResponse.ok) {
                throw new Error("Failed to save evidence")
            }

            // Trigger refund
            const refundResponse = await fetch("/api/payments/refund", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    transactionId: link.transaction_id,
                    reason: `Buyer rejected: ${issueDescription}`,
                    initiatedBy: "buyer",
                }),
            })

            if (!refundResponse.ok) {
                throw new Error("Refund failed")
            }

            setOrderStatus('refunded')
            toast.success("Refund requested. Funds will be returned within 3-5 business days.")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to process refund")
        } finally {
            setIsUpdatingStatus(false)
        }
    }

    const handleNotReceived = async () => {
        if (!issueDescription.trim()) {
            toast.error("Please describe when it was supposed to arrive")
            return
        }

        setIsUpdatingStatus(true)
        try {
            // Save evidence
            await fetch("/api/delivery/reject", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    confirmation_id: link.id,
                    reason: `Item not received: ${issueDescription}`,
                    evidence_photos: [],
                }),
            })

            // Trigger refund
            const refundResponse = await fetch("/api/payments/refund", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    transactionId: link.transaction_id,
                    reason: `Item not received: ${issueDescription}`,
                    initiatedBy: "buyer",
                }),
            })

            if (!refundResponse.ok) {
                throw new Error("Refund failed")
            }

            setOrderStatus('refunded')
            toast.success("Refund requested. Funds will be returned within 3-5 business days.")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to request refund")
        } finally {
            setIsUpdatingStatus(false)
        }
    }

    // PIN Entry View
    if (!isUnlocked) {
        return (
            <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-4 font-sans">
                <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mb-4 shadow-xl">
                            <Lock className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-serif font-medium tracking-tight">Private Link</h1>
                        <p className="text-muted-foreground">Enter the PIN provided by the seller to view this item.</p>
                    </div>

                    <form onSubmit={handleUnlock} className="bg-card p-8 rounded-3xl shadow-2xl shadow-black/5 border border-border space-y-6">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Security PIN</Label>
                            <Input
                                type="password"
                                value={accessPin}
                                onChange={(e) => setAccessPin(e.target.value)}
                                className="text-center text-2xl tracking-[1em] h-16 font-mono bg-muted/30 border-2 focus:border-primary focus:ring-0 transition-all rounded-xl"
                                placeholder="••••"
                                maxLength={4}
                                autoFocus
                            />
                            {error && <p className="text-sm text-destructive text-center font-medium">{error}</p>}
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-14 text-lg font-medium rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
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
        <div className="min-h-screen bg-background font-sans selection:bg-primary/30">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" />
                        <span className="font-serif font-bold text-xl tracking-tight">krowba</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-xs font-medium px-3 py-1 bg-muted border border-border rounded-full text-muted-foreground">
                            {isSold ? 'Order Tracking' : 'Secure Checkout'}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="rounded-full"
                        >
                            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">Toggle theme</span>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">

                    {/* Left Column: Product Visuals */}
                    <div className="space-y-6 lg:sticky lg:top-24">
                        <div className="aspect-square relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/5 bg-muted border border-border group">
                            <CometCard className="w-full h-full">
                                {link.images && link.images.length > 0 ? (
                                    <Image
                                        src={link.images[selectedImage]}
                                        alt={link.item_name}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        priority
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-muted">
                                        <Package className="w-16 h-16 text-muted-foreground/30" />
                                    </div>
                                )}


                            </CometCard>

                            {/* Status Badge Overlay */}
                            {isSold && (
                                <div className="absolute top-4 right-4 px-4 py-2 bg-background/80 backdrop-blur text-foreground text-sm font-medium rounded-full flex items-center gap-2 border border-border pointer-events-none z-10">
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
                                            selectedImage === idx ? "border-primary ring-2 ring-primary/20" : "border-transparent opacity-50 hover:opacity-100"
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
                            <h1 className="text-4xl sm:text-5xl font-serif font-medium leading-[1.1] mb-4 text-foreground">
                                {link.item_name}
                            </h1>

                            {/* Seller Info */}
                            {link.seller && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                        <span className="font-serif text-xs text-foreground">
                                            {link.seller.business_name?.charAt(0) || 'S'}
                                        </span>
                                    </div>
                                    <span>Sold by <span className="text-foreground font-medium">{link.seller.business_name || 'Verified Seller'}</span></span>
                                </div>
                            )}

                            <div className="prose prose-invert prose-p:text-muted-foreground prose-p:leading-relaxed max-w-none">
                                <p>{link.items?.description || link.description || "No description provided."}</p>
                            </div>
                        </div>

                        {/* Price Card */}
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-purple-600/50 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                            <div className="relative bg-card border border-border rounded-2xl p-6 shadow-xl space-y-4">
                                <div className="flex justify-between items-baseline pb-4 border-b border-border border-dashed">
                                    <span className="text-muted-foreground font-medium">Total Price</span>
                                    <span className="text-3xl font-bold font-serif text-foreground">
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
                        </div>

                        {/* Action Section */}
                        {!isSold ? (
                            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700 delay-200">
                                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                        <ShieldCheck className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground">Protected by Krowba Escrow</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Your money is held safely until you confirm delivery. The seller doesn't get paid until you're happy.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Your Name</Label>
                                        <Input
                                            placeholder="John Doe"
                                            value={buyerName}
                                            onChange={(e) => setBuyerName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email Address</Label>
                                        <Input
                                            placeholder="john@example.com"
                                            type="email"
                                            value={buyerEmail}
                                            onChange={(e) => setBuyerEmail(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Phone Number (M-Pesa)</Label>
                                        <Input
                                            placeholder="0712345678"
                                            type="tel"
                                            value={buyerPhone}
                                            onChange={(e) => setBuyerPhone(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={handlePayNow}
                                    disabled={isProcessing || !buyerName || !buyerPhone || !buyerEmail}
                                    className="w-full h-16 text-lg font-semibold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_30px_-10px_var(--primary)] transition-all hover:scale-[1.01] active:scale-[0.99]"
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
                                <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
                                    <h3 className="font-serif text-xl font-medium mb-6 text-foreground">Order Status</h3>

                                    <div className="relative space-y-8 pl-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                                        {/* Step 1: Paid */}
                                        <div className="relative">
                                            <div className="absolute -left-[35px] w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-background shadow-[0_0_10px_var(--primary)]">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">Payment Confirmed</p>
                                                <p className="text-sm text-muted-foreground">Funds held in escrow</p>
                                            </div>
                                        </div>

                                        {/* Step 2: Shipped */}
                                        <div className="relative">
                                            <div className={cn(
                                                "absolute -left-[35px] w-6 h-6 rounded-full flex items-center justify-center border-2 border-background shadow-sm transition-all duration-500",
                                                ['shipped', 'delivered'].includes(orderStatus) ? "bg-primary shadow-[0_0_10px_var(--primary)]" : "bg-muted border-border"
                                            )}>
                                                {['shipped', 'delivered'].includes(orderStatus) && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
                                            </div>
                                            <div>
                                                <p className={cn("font-medium transition-colors", ['shipped', 'delivered'].includes(orderStatus) ? "text-foreground" : "text-muted-foreground")}>
                                                    Shipped
                                                </p>
                                                {orderStatus === 'shipped' && (
                                                    <p className="text-sm text-primary font-medium animate-pulse">In Transit...</p>
                                                )}

                                                {/* Shipping Details */}
                                                {['shipped', 'delivered'].includes(orderStatus) && (
                                                    <div className="mt-4 bg-muted/50 rounded-xl p-4 space-y-3 text-sm border border-border/50">
                                                        {link.shipping_courier && (
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Courier:</span>
                                                                <span className="font-medium">{link.shipping_courier}</span>
                                                            </div>
                                                        )}
                                                        {link.tracking_number && (
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Tracking #:</span>
                                                                <span className="font-mono bg-background px-1.5 py-0.5 rounded border border-border">{link.tracking_number}</span>
                                                            </div>
                                                        )}
                                                        {link.shipping_notes && (
                                                            <div className="pt-2 border-t border-border/50">
                                                                <span className="text-muted-foreground block mb-1">Note from Seller:</span>
                                                                <p className="italic text-foreground/80">"{link.shipping_notes}"</p>
                                                            </div>
                                                        )}
                                                        {link.shipping_proof_url && (
                                                            <div className="pt-2">
                                                                <a
                                                                    href={link.shipping_proof_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center text-primary hover:underline text-xs"
                                                                >
                                                                    <Package className="w-3 h-3 mr-1" />
                                                                    View Shipping Proof
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Step 3: Delivered */}
                                        <div className="relative">
                                            <div className={cn(
                                                "absolute -left-[35px] w-6 h-6 rounded-full flex items-center justify-center border-2 border-background shadow-sm transition-all duration-500",
                                                orderStatus === 'delivered' ? "bg-primary shadow-[0_0_10px_var(--primary)]" : "bg-muted border-border"
                                            )}>
                                                {orderStatus === 'delivered' && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
                                            </div>
                                            <div>
                                                <p className={cn("font-medium transition-colors", orderStatus === 'delivered' ? "text-foreground" : "text-muted-foreground")}>
                                                    Delivered
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Buyer Actions - 3 Button Flow */}
                                {orderStatus === 'shipped' && (
                                    !selectedAction ? (
                                        <div className="space-y-3">
                                            {/* Button 1: Accept Item */}
                                            <Button
                                                onClick={handleConfirmDelivery}
                                                disabled={isUpdatingStatus}
                                                className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-lg shadow-[0_0_20px_-5px_var(--primary)]"
                                            >
                                                {isUpdatingStatus ? <Loader2 className="animate-spin" /> : (
                                                    <span className="flex items-center gap-2">
                                                        <CheckCircle2 className="h-5 w-5" />
                                                        Item Received & OK → Release Funds
                                                    </span>
                                                )}
                                            </Button>

                                            {/* Button 2: Reject Item */}
                                            <Button
                                                onClick={() => setSelectedAction("reject")}
                                                variant="outline"
                                                className="w-full h-12 border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950 rounded-xl"
                                            >
                                                <AlertTriangle className="h-4 w-4 mr-2" />
                                                Item Received But Not As Described
                                            </Button>

                                            {/* Button 3: Not Received */}
                                            <Button
                                                onClick={() => setSelectedAction("not-received")}
                                                variant="outline"
                                                className="w-full h-12 rounded-xl"
                                            >
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Item Not Received
                                            </Button>

                                            <p className="text-xs text-center text-muted-foreground mt-3">
                                                <ShieldCheck className="inline h-3 w-3 mr-1" />
                                                Your payment is protected by Krowba escrow
                                            </p>
                                        </div>
                                    ) : selectedAction === "reject" ? (
                                        <div className="space-y-4">
                                            <div className="border border-border p-4 rounded-lg">
                                                <h3 className="font-medium mb-3">What's different from the listing?</h3>
                                                <textarea
                                                    className="w-full border border-border p-3 text-sm min-h-[100px] bg-background rounded-lg"
                                                    placeholder="Describe the differences (e.g., wrong size, damaged, missing parts)"
                                                    value={issueDescription}
                                                    onChange={(e) => setIssueDescription(e.target.value)}
                                                />

                                                <div className="mt-4">
                                                    <Label className="mb-2 block">Upload Evidence (Optional)</Label>
                                                    <ImageUploader images={evidencePhotos} onImagesChange={setEvidencePhotos} maxImages={5} folder="evidence" />
                                                </div>
                                            </div>

                                            <Button
                                                onClick={handleRejectItem}
                                                variant="destructive"
                                                className="w-full h-12 rounded-xl"
                                                disabled={isUpdatingStatus || !issueDescription.trim()}
                                            >
                                                {isUpdatingStatus ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                                Submit & Request Refund
                                            </Button>

                                            <Button onClick={() => setSelectedAction(null)} variant="ghost" className="w-full">
                                                Cancel
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="border border-border p-4 rounded-lg">
                                                <h3 className="font-medium mb-3">Delivery Issue</h3>
                                                <textarea
                                                    className="w-full border border-border p-3 text-sm min-h-[100px] bg-background rounded-lg"
                                                    placeholder="When was it supposed to arrive? Any other details..."
                                                    value={issueDescription}
                                                    onChange={(e) => setIssueDescription(e.target.value)}
                                                />
                                            </div>

                                            <Button
                                                onClick={handleNotReceived}
                                                variant="destructive"
                                                className="w-full h-12 rounded-xl"
                                                disabled={isUpdatingStatus || !issueDescription.trim()}
                                            >
                                                {isUpdatingStatus ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                                Request Refund
                                            </Button>

                                            <Button onClick={() => setSelectedAction(null)} variant="ghost" className="w-full">
                                                Cancel
                                            </Button>
                                        </div>
                                    )
                                )}

                                {orderStatus === 'delivered' && (
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                                        <p className="text-green-600 dark:text-green-400 font-medium">Transaction Completed</p>
                                        <p className="text-sm text-green-600/80 dark:text-green-500/80">Thank you for using Krowba!</p>
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
