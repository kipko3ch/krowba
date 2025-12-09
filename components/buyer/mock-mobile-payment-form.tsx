"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, Loader2, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface MockMobilePaymentFormProps {
    amount: number
    krowbaLinkId: string
    buyerPhone: string
    buyerName?: string
    onSuccess: (reference: string) => void
    onCancel: () => void
}

export function MockMobilePaymentForm({ amount, krowbaLinkId, buyerPhone, buyerName, onSuccess, onCancel }: MockMobilePaymentFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [showPrompt, setShowPrompt] = useState(false)

    const handleSubmit = async () => {
        setIsLoading(true)
        setShowPrompt(true)

        // Simulate STK push prompt
        await new Promise((resolve) => setTimeout(resolve, 1000))

        try {
            const response = await fetch("/api/mock/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    payment_method: "mobile",
                    amount,
                    krowba_link_id: krowbaLinkId,
                    buyer_phone: buyerPhone,
                    buyer_name: buyerName,
                }),
            })

            const result = await response.json()

            setShowPrompt(false)

            if (!response.ok || !result.success) {
                toast.error(result.message || "Payment failed")
                setIsLoading(false)
                return
            }

            toast.success(result.message)
            onSuccess(result.reference)
        } catch (error) {
            setShowPrompt(false)
            toast.error("Payment processing failed. Please try again.")
            setIsLoading(false)
        }
    }

    return (
        <Card className="bg-card border-border">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    M-Pesa Payment (Test Mode)
                </CardTitle>
                <CardDescription>Simulated STK Push to {buyerPhone}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Amount Display */}
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Amount to Pay</p>
                    <p className="text-3xl font-bold">KES {amount.toLocaleString()}</p>
                </div>

                {/* Phone Display */}
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{buyerPhone}</span>
                </div>

                {/* STK Prompt Simulation */}
                {showPrompt && (
                    <div className="border border-[#44f91f]/30 bg-[#44f91f]/5 rounded-lg p-4 animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-[#44f91f]/20 flex items-center justify-center">
                                <Phone className="h-5 w-5 text-[#44f91f]" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-sm">M-Pesa Prompt Sent</p>
                                <p className="text-xs text-muted-foreground">Check your phone and enter PIN...</p>
                            </div>
                            <Loader2 className="h-5 w-5 animate-spin text-[#44f91f]" />
                        </div>
                    </div>
                )}

                {/* Test Mode Info */}
                {!showPrompt && (
                    <div className="space-y-3">
                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Test Phone Numbers</span>
                            </div>
                            <div className="space-y-1.5 text-xs text-blue-700 dark:text-blue-300">
                                <div>
                                    <code className="font-mono bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">0712345678</code>
                                    {' '}or{' '}
                                    <code className="font-mono bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">254712345678</code>
                                </div>
                                <p className="text-blue-600 dark:text-blue-400">85% success rate • No real money charged</p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex gap-3">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="flex-1">
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    className="flex-1 bg-[#44f91f] hover:bg-[#3de018] text-black font-bold"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Phone className="mr-2 h-4 w-4" />
                            Send STK Push
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    )
}
