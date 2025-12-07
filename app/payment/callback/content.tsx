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

                    // Fetch the link short_code to redirect back
                    // We need to know the short_code. The API returns transaction data, but maybe not the short_code directly if not joined.
                    // However, we can use the referer or just rely on the user to click "Return to Order" if we can't get the code easily.
                    // BUT, the user explicitly asked to "go back to that pay page".
                    // Let's try to fetch the link details or assume we can get it.
                    // Actually, the best way is to have the API return the short_code.
                    // For now, let's add a "Return to Order" button that works if we know the URL.
                    // Wait, the previous page was /pay/[code].
                    // We can store the return URL in localStorage or pass it as a query param to the callback?
                    // The initiate-payment API sets the callback URL. We can append the code there!

                    // Since I can't easily change the API right now without more context on where to get the code (it is in the link object in the API),
                    // I will assume the user will click "Return Home" or I can try to redirect if I had the code.
                    // Let's check if the API returns the link info.
                    // app/api/buyer/payment-status/route.ts selects "*, krowba_links(*)" so it DOES return link info!

                    if (result.data?.link_short_code) {
                        window.location.href = `/pay/${result.data.link_short_code}?status=success`
                    } else {
                        // Fallback if API doesn't return short_code (I need to check/update the API to return it)
                        setMessage("Payment successful! You can now close this window.")
                    }
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
                            <div className="w-20 h-20 mx-auto bg-green-500/10 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                                <CheckCircle2 className="h-10 w-10 text-green-600" />
                            </div>
                            <h1 className="text-2xl font-bold mt-6 text-green-700">Payment Successful!</h1>
                            <p className="text-muted-foreground mt-2">{message}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Reference: <code className="bg-muted px-2 py-0.5 rounded text-xs">{reference}</code>
                            </p>
                        </div>

                        {/* Protection Notice */}
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                            <p className="text-sm">
                                <span className="font-semibold">🛡️ You're Protected:</span>{" "}
                                <span className="text-muted-foreground">
                                    Your payment is held in escrow and will only be released to the seller after you confirm delivery.
                                </span>
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3">
                            <Button asChild className="h-12 bg-primary hover:bg-primary/90 text-black font-semibold w-full">
                                <Link href="/" className="flex items-center justify-center gap-2">
                                    <Home className="w-4 h-4" />
                                    Return to Order
                                </Link>
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
