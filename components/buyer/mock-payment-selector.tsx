"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CreditCard, Smartphone } from "lucide-react"
import type { PaymentMethod } from "@/types"

interface MockPaymentSelectorProps {
    onMethodSelect: (method: PaymentMethod) => void
    selectedMethod: PaymentMethod
}

export function MockPaymentSelector({ onMethodSelect, selectedMethod }: MockPaymentSelectorProps) {
    return (
        <Card className="bg-card border-border">
            <CardHeader>
                <CardTitle className="text-lg">Choose Payment Method</CardTitle>
                <CardDescription>Select how you'd like to pay (Test Mode)</CardDescription>
            </CardHeader>
            <CardContent>
                <RadioGroup value={selectedMethod} onValueChange={(value) => onMethodSelect(value as PaymentMethod)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Card Payment */}
                        <label
                            htmlFor="card"
                            className={`flex items-center gap-4 border rounded-lg p-4 cursor-pointer transition-all ${selectedMethod === "card"
                                ? "border-[#44f91f] bg-[#44f91f]/5"
                                : "border-border hover:border-[#44f91f]/50"
                                }`}
                        >
                            <RadioGroupItem value="card" id="card" />
                            <div className="flex items-center gap-3 flex-1">
                                <div className="p-2 bg-[#44f91f]/10 rounded-lg">
                                    <CreditCard className="h-5 w-5 text-[#44f91f]" />
                                </div>
                                <div>
                                    <p className="font-medium">Card Payment</p>
                                    <p className="text-xs text-muted-foreground">Visa, Mastercard</p>
                                </div>
                            </div>
                        </label>

                        {/* Mobile Payment */}
                        <label
                            htmlFor="mobile"
                            className={`flex items-center gap-4 border rounded-lg p-4 cursor-pointer transition-all ${selectedMethod === "mobile"
                                ? "border-[#44f91f] bg-[#44f91f]/5"
                                : "border-border hover:border-[#44f91f]/50"
                                }`}
                        >
                            <RadioGroupItem value="mobile" id="mobile" />
                            <div className="flex items-center gap-3 flex-1">
                                <div className="p-2 bg-[#44f91f]/10 rounded-lg">
                                    <Smartphone className="h-5 w-5 text-[#44f91f]" />
                                </div>
                                <div>
                                    <p className="font-medium">Mobile Money</p>
                                    <p className="text-xs text-muted-foreground">M-Pesa</p>
                                </div>
                            </div>
                        </label>
                    </div>
                </RadioGroup>

                {/* Test Mode Indicator */}
                <div className="mt-4 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-xs text-muted-foreground">
                        <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        Test Mode Active
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
