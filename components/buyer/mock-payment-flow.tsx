"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { MockPaymentSelector } from "@/components/buyer/mock-payment-selector"
import { MockCardPaymentForm } from "@/components/buyer/mock-card-payment-form"
import { MockMobilePaymentForm } from "@/components/buyer/mock-mobile-payment-form"
import { CheckCircle } from "lucide-react"
import type { PaymentMethod } from "@/types"
import type { KrowbaLink } from "@/types"

interface MockPaymentFlowProps {
    link: KrowbaLink & {
        sellers: {
            business_name: string
        }
    }
    buyerPhone: string
    buyerName?: string
}

export function MockPaymentFlow({ link, buyerPhone, buyerName }: MockPaymentFlowProps) {
    const router = useRouter()
    const [step, setStep] = useState<"select" | "card" | "mobile" | "success">("select")
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("mobile")
    const [paymentReference, setPaymentReference] = useState("")

    const totalAmount = link.item_price + link.delivery_fee
    const depositAmount = link.deposit_amount || link.delivery_fee
    const amountToPay = link.escrow_mode === "full_escrow" ? totalAmount : depositAmount

    const handleMethodSelect = (method: PaymentMethod) => {
        setSelectedMethod(method)
        setStep(method)
    }

    const handlePaymentSuccess = (reference: string) => {
        setPaymentReference(reference)
        setStep("success")

        // Redirect to success page after delay
        setTimeout(() => {
            router.push(`/payment/success?ref=${reference}`)
        }, 3000)
    }

    const handleCancel = () => {
        setStep("select")
    }

    if (step === "success") {
        return (
            <Card className="bg-card border-border">
                <CardContent className="p-12 text-center">
                    <div className="h-16 w-16 bg-green-500/10 flex items-center justify-center mx-auto mb-4 rounded-full">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
                    <p className="text-muted-foreground mb-4">Your funds are secured in escrow</p>
                    <code className="text-xs bg-muted px-3 py-1 rounded">{paymentReference}</code>
                    <p className="text-sm text-muted-foreground mt-4">Redirecting...</p>
                </CardContent>
            </Card>
        )
    }

    if (step === "card") {
        return (
            <MockCardPaymentForm
                amount={amountToPay}
                krowbaLinkId={link.id}
                buyerPhone={buyerPhone}
                buyerName={buyerName}
                onSuccess={handlePaymentSuccess}
                onCancel={handleCancel}
            />
        )
    }

    if (step === "mobile") {
        return (
            <MockMobilePaymentForm
                amount={amountToPay}
                krowbaLinkId={link.id}
                buyerPhone={buyerPhone}
                buyerName={buyerName}
                onSuccess={handlePaymentSuccess}
                onCancel={handleCancel}
            />
        )
    }

    return (
        <div className="space-y-4">
            <MockPaymentSelector onMethodSelect={handleMethodSelect} selectedMethod={selectedMethod} />

            {/* Amount Summary */}
            <Card className="bg-muted/50 border-border">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                {link.escrow_mode === "full_escrow" ? "Total Amount" : "Deposit Required"}
                            </p>
                            <p className="text-2xl font-bold">KES {amountToPay.toLocaleString()}</p>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                            <p>Item: KES {link.item_price.toLocaleString()}</p>
                            <p>Delivery: KES {link.delivery_fee.toLocaleString()}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
