"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

import { Shield, Truck, Lock, CheckCircle2, AlertTriangle, Loader2, Phone } from "lucide-react"
import { toast } from "sonner"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import type { KrowbaLink } from "@/types"

interface PaymentPageProps {
    link: KrowbaLink & {
        sellers: {
            business_name: string
            verification_score: number
            successful_transactions: number
            total_transactions: number
        }
        items?: {
            description: string | null
        }
    }
}

export function PaymentPage({ link }: PaymentPageProps) {
    const [phoneNumber, setPhoneNumber] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!phoneNumber || phoneNumber.length < 10) {
            toast.error("Please enter a valid phone number")
            return
        }

        setIsLoading(true)

        try {
            // TODO: Implement actual payment API call
            // const response = await fetch("/api/payhero/initiate", { ... })

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000))

            toast.success("Payment initiated! Check your phone for the STK push.")
        } catch (error) {
            toast.error("Failed to initiate payment. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const totalAmount = link.item_price + link.delivery_fee
    const depositAmount = link.deposit_amount || link.delivery_fee

    return (
        <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
            <div className="w-full max-w-4xl flex justify-end mb-4">
                <ThemeToggle />
            </div>
            <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Product Details Column */}
                <div className="space-y-6">
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg">
                        {link.images && link.images.length > 0 ? (
                            <div className="relative h-64 w-full bg-black/50">
                                <Image
                                    src={link.images[0]}
                                    alt={link.item_name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div className="h-64 w-full bg-[#1a2e1d] flex items-center justify-center text-[#44f91f]/40">
                                <Shield className="h-16 w-16" />
                            </div>
                        )}

                        <div className="p-6 space-y-4">
                            <div>
                                <h1 className="text-2xl font-bold text-foreground mb-2">{link.item_name}</h1>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    {link.items?.description || "No description provided."}
                                </p>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                <div className="flex items-center gap-1.5">
                                    <Shield className="h-4 w-4 text-[#44f91f]" />
                                    <span>Escrow Protected</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Truck className="h-4 w-4 text-[#44f91f]" />
                                    <span>Delivery Included</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Seller Info */}
                    <div className="bg-card border border-border rounded-xl p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Sold by</p>
                            <p className="font-semibold text-foreground">{link.sellers?.business_name || "Verified Seller"}</p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-1.5 text-[#44f91f]">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="font-medium">{link.sellers?.verification_score || 98}% Verified</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{link.sellers?.successful_transactions || 0} successful sales</p>
                        </div>
                    </div>
                </div>

                {/* Payment Column */}
                <div className="space-y-6">
                    <Card className="bg-card border-border shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-xl text-foreground">Secure Payment</CardTitle>
                            <CardDescription className="text-muted-foreground">
                                Complete your purchase securely with M-Pesa
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            {/* Price Breakdown */}
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Item Price</span>
                                    <span>KES {link.item_price.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Delivery Fee</span>
                                    <span>KES {link.delivery_fee.toLocaleString()}</span>
                                </div>
                                <Separator className="bg-border" />
                                <div className="flex justify-between font-bold text-lg text-foreground">
                                    <span>Total</span>
                                    <span>KES {totalAmount.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Escrow Mode Info */}
                            <div className="bg-[#44f91f]/10 border border-[#44f91f]/20 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    {link.escrow_mode === "full_escrow" ? (
                                        <Shield className="h-5 w-5 text-[#44f91f] mt-0.5" />
                                    ) : (
                                        <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                                    )}
                                    <div>
                                        <p className="font-medium text-foreground text-sm">
                                            {link.escrow_mode === "full_escrow" ? "Full Escrow Protection" : "Split-Risk Protection"}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {link.escrow_mode === "full_escrow"
                                                ? "Your funds are held securely until you confirm delivery."
                                                : `Pay KES ${depositAmount.toLocaleString()} deposit now. Balance due on delivery.`}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Form */}
                            <form onSubmit={handlePayment} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-foreground">M-Pesa Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="07XX XXX XXX"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            className="bg-background border-input text-foreground pl-10 focus:border-[#44f91f] focus:ring-[#44f91f]"
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-[#44f91f] hover:bg-[#3de018] text-black font-bold"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="mr-2 h-4 w-4" />
                                            Pay KES {(link.escrow_mode === "full_escrow" ? totalAmount : depositAmount).toLocaleString()}
                                        </>
                                    )}
                                </Button>
                            </form>

                        </CardContent>
                        <CardFooter className="justify-center border-t border-border pt-6">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Shield className="h-3 w-3" />
                                <span className="text-[#44f91f]">Secured by Krowba Escrow</span>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    )
}
