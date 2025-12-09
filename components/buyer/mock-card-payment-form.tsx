"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CreditCard, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"

interface MockCardPaymentFormProps {
    amount: number
    krowbaLinkId: string
    buyerPhone: string
    buyerName?: string
    onSuccess: (reference: string) => void
    onCancel: () => void
}

export function MockCardPaymentForm({ amount, krowbaLinkId, buyerPhone, buyerName, onSuccess, onCancel }: MockCardPaymentFormProps) {
    const [cardNumber, setCardNumber] = useState("")
    const [expiry, setExpiry] = useState("")
    const [cvv, setCvv] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const formatCardNumber = (value: string) => {
        const cleaned = value.replace(/\s/g, "")
        const chunks = cleaned.match(/.{1,4}/g) || []
        return chunks.join(" ").substring(0, 19) // Max 16 digits + 3 spaces
    }

    const formatExpiry = (value: string) => {
        const cleaned = value.replace(/\D/g, "")
        if (cleaned.length >= 2) {
            return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`
        }
        return cleaned
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!cardNumber || !expiry || !cvv) {
            toast.error("Please fill in all card details")
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch("/api/mock/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    payment_method: "card",
                    amount,
                    krowba_link_id: krowbaLinkId,
                    buyer_phone: buyerPhone,
                    buyer_name: buyerName,
                    card_number: cardNumber.replace(/\s/g, ""),
                    card_expiry: expiry,
                    card_cvv: cvv,
                }),
            })

            const result = await response.json()

            if (!response.ok || !result.success) {
                toast.error(result.message || "Payment failed")
                return
            }

            toast.success(result.message)
            onSuccess(result.reference)
        } catch (error) {
            toast.error("Payment processing failed. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="bg-card border-border">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Card Payment (Test Mode)
                </CardTitle>
                <CardDescription>Use test cards for simulation</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {/* Test Card Hints */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <span className="text-xs font-medium text-green-700 dark:text-green-300">Test Success</span>
                            </div>
                            <code className="text-sm font-mono text-green-800 dark:text-green-200">4242 4242 4242 4242</code>
                        </div>
                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                <span className="text-xs font-medium text-red-700 dark:text-red-300">Test Decline</span>
                            </div>
                            <code className="text-sm font-mono text-red-800 dark:text-red-200">4000 0000 0000 0002</code>
                        </div>
                    </div>

                    {/* Card Number */}
                    <div className="space-y-2">
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                            id="cardNumber"
                            type="text"
                            placeholder="4242 4242 4242 4242"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                            maxLength={19}
                            className="bg-background border-input"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Expiry */}
                        <div className="space-y-2">
                            <Label htmlFor="expiry">Expiry Date</Label>
                            <Input
                                id="expiry"
                                type="text"
                                placeholder="MM/YY"
                                value={expiry}
                                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                                maxLength={5}
                                className="bg-background border-input"
                            />
                        </div>

                        {/* CVV */}
                        <div className="space-y-2">
                            <Label htmlFor="cvv">CVV</Label>
                            <Input
                                id="cvv"
                                type="text"
                                placeholder="123"
                                value={cvv}
                                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").substring(0, 3))}
                                maxLength={3}
                                className="bg-background border-input"
                            />
                        </div>
                    </div>

                    {/* Amount Display */}
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-sm text-muted-foreground">Amount to Pay</p>
                        <p className="text-2xl font-bold">KES {amount.toLocaleString()}</p>
                    </div>
                </CardContent>

                <CardFooter className="flex gap-3">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="flex-1">
                        Cancel
                    </Button>
                    <Button type="submit" className="flex-1 bg-[#44f91f] hover:bg-[#3de018] text-black font-bold" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>Pay Now</>
                        )}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
