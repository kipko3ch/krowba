"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle2, XCircle, Loader2, MessageCircle, Camera, ArrowRight, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function PaymentCallbackContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [status, setStatus] = useState<"loading" | "success" | "failed">("loading")
    const [message, setMessage] = useState("")

    const reference = searchParams.get("reference") || searchParams.get("ref")

    useEffect(() => {
        if (!reference) {
            setStatus("failed")
            setMessage("Invalid payment reference")
            return
        }

        // Verify payment status
        const verifyPayment = async () => {
            try {
                const response = await fetch(`/api/buyer/payment-status?reference=${reference}`)
                const result = await response.json()

                if (result.success && result.data?.status === "completed") {
                    setStatus("success")
                    setMessage("Your payment was successful!")
                } else if (result.data?.status === "pending") {
                    setMessage("Payment is being processed...")
                    // Retry after a delay
                    setTimeout(verifyPayment, 3000)
                } else {
                    setStatus("failed")
                    setMessage(result.error || "Payment verification failed")
                }
            } catch {
                setStatus("failed")
                setMessage("Unable to verify payment status")
            }
        }

        verifyPayment()
    }, [reference])

    return (
        <div className="min-h-dvh bg-background">
            {/* Header */}
            <header className="border-b border-border">
                <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-center">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="font-semibold text-lg">krowba</span>
                    </Link>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-12">
                {status === "loading" && (
                    <div className="text-center space-y-6">
                        <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center">
                            <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Verifying Payment</h1>
                            <p className="text-muted-foreground mt-2">{message || "Please wait..."}</p>
                        </div>
                    </div>
                )}

                {status === "success" && (
                    <div className="space-y-8">
                        {/* Success Icon */}
                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="h-10 w-10 text-primary" />
                            </div>
                            <h1 className="text-2xl font-bold mt-6 text-primary">Payment Successful!</h1>
                            <p className="text-muted-foreground mt-2">{message}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Reference: <code className="bg-muted px-2 py-0.5 rounded text-xs">{reference}</code>
                            </p>
                        </div>

                        {/* Next Steps Card */}
                        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                            <h2 className="font-semibold text-lg">What's Next?</h2>

                            <div className="space-y-4">
                                {/* Step 1 */}
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <Camera className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Take a Screenshot</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Capture this confirmation screen as proof of payment
                                        </p>
                                    </div>
                                </div>

                                {/* Step 2 */}
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <MessageCircle className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Contact the Seller</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Send the screenshot to the seller via WhatsApp or chat to confirm your order
                                        </p>
                                    </div>
                                </div>

                                {/* Step 3 */}
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <CheckCircle2 className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Confirm Delivery</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Once you receive your item, confirm delivery so the seller gets paid
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Protection Notice */}
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                            <p className="text-sm">
                                <span className="font-semibold">🛡️ You're Protected:</span>{" "}
                                <span className="text-muted-foreground">
                                    Your payment is held in escrow and will only be released to the seller after you confirm delivery.
                                </span>
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button asChild className="flex-1 h-12 bg-primary hover:bg-primary/90 text-black font-semibold">
                                <Link href="/" className="flex items-center justify-center gap-2">
                                    <Home className="w-4 h-4" />
                                    Return Home
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="flex-1 h-12 font-semibold">
                                <a
                                    href="https://wa.me/?text=I%20just%20made%20a%20payment%20on%20Krowba.%20Here%20is%20my%20confirmation."
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    Open WhatsApp
                                    <ArrowRight className="w-4 h-4" />
                                </a>
                            </Button>
                        </div>
                    </div>
                )}

                {status === "failed" && (
                    <div className="text-center space-y-6">
                        <div className="w-20 h-20 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
                            <XCircle className="h-10 w-10 text-destructive" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-destructive">Payment Failed</h1>
                            <p className="text-muted-foreground mt-2">{message}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <Button variant="outline" onClick={() => router.back()} className="flex-1 h-12">
                                Try Again
                            </Button>
                            <Button asChild className="flex-1 h-12 bg-primary hover:bg-primary/90 text-black">
                                <Link href="/">Return Home</Link>
                            </Button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
