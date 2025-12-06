"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
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
                    setMessage("Your payment was successful! The seller has been notified.")
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
        <div className="min-h-dvh bg-background flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-6">
                {status === "loading" && (
                    <>
                        <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                            <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Verifying Payment</h1>
                            <p className="text-muted-foreground mt-2">{message || "Please wait..."}</p>
                        </div>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div className="w-20 h-20 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-10 w-10 text-green-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-green-600">Payment Successful!</h1>
                            <p className="text-muted-foreground mt-2">{message}</p>
                        </div>
                        <div className="pt-4">
                            <p className="text-sm text-muted-foreground mb-4">
                                Reference: <code className="bg-muted px-2 py-1 rounded">{reference}</code>
                            </p>
                            <Button asChild>
                                <Link href="/">Return Home</Link>
                            </Button>
                        </div>
                    </>
                )}

                {status === "failed" && (
                    <>
                        <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
                            <XCircle className="h-10 w-10 text-red-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-red-600">Payment Failed</h1>
                            <p className="text-muted-foreground mt-2">{message}</p>
                        </div>
                        <div className="pt-4 space-y-3">
                            <Button variant="outline" onClick={() => router.back()}>
                                Try Again
                            </Button>
                            <Button asChild variant="ghost">
                                <Link href="/">Return Home</Link>
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
