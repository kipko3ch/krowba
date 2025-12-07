"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { Zap, AlertCircle } from "lucide-react"

export default function TestWebhooksPage() {
    const [reference, setReference] = useState("")
    const [loading, setLoading] = useState(false)
    const isTestMode = process.env.NEXT_PUBLIC_PAYSTACK_MODE === "test"

    const simulateWebhook = async (event: string) => {
        setLoading(true)
        try {
            const response = await fetch("/api/webhooks/paystack", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-paystack-signature": "test_signature",
                },
                body: JSON.stringify({
                    event,
                    data: {
                        reference: reference || `TEST_${Date.now()}`,
                        status: "success",
                        amount: 100000, // KES 1,000
                        currency: "KES",
                        customer: {
                            email: "test@example.com",
                            customer_code: "CUS_test",
                        },
                        transfer_code: `TRF_${Date.now()}`,
                    },
                }),
            })

            const data = await response.json()

            if (response.ok) {
                toast.success(`${event} webhook simulated successfully`)
            } else {
                toast.error(data.error || "Webhook simulation failed")
            }
        } catch (error) {
            console.error("Webhook error:", error)
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    if (!isTestMode) {
        return (
            <main className="container mx-auto px-4 py-8 max-w-7xl">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Test webhooks are only available in test mode. Set PAYSTACK_MODE=test in your
                        environment variables.
                    </AlertDescription>
                </Alert>
            </main>
        )
    }

    return (
        <main className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Zap className="h-8 w-8 text-yellow-500" />
                    Test Webhook Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">
                    Simulate Paystack webhook events for testing the payout flow
                </p>
            </div>

            <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    <strong>Test Mode Active</strong> - These webhooks will trigger real database changes but
                    no actual money transfers will occur.
                </AlertDescription>
            </Alert>

            <Card>
                <CardHeader>
                    <CardTitle>Simulate Webhooks</CardTitle>
                    <CardDescription>
                        Trigger webhook events to test escrow and payout functionality
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Reference input */}
                    <div className="space-y-2">
                        <Label htmlFor="reference">
                            Transaction/Transfer Reference (Optional)
                        </Label>
                        <Input
                            id="reference"
                            placeholder="Leave empty for auto-generated"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Use an actual reference from your database to test with real data
                        </p>
                    </div>

                    {/* Webhook buttons */}
                    <div className="grid gap-3">
                        <Button
                            onClick={() => simulateWebhook("charge.success")}
                            disabled={loading}
                            variant="outline"
                            className="justify-start"
                        >
                            <div className="flex flex-col items-start">
                                <span className="font-semibold">charge.success</span>
                                <span className="text-xs text-muted-foreground">
                                    Simulate successful payment → Locks escrow
                                </span>
                            </div>
                        </Button>

                        <Button
                            onClick={() => simulateWebhook("transfer.success")}
                            disabled={loading}
                            variant="outline"
                            className="justify-start"
                        >
                            <div className="flex flex-col items-start">
                                <span className="font-semibold">transfer.success</span>
                                <span className="text-xs text-muted-foreground">
                                    Simulate successful payout → Marks payout SUCCESS
                                </span>
                            </div>
                        </Button>

                        <Button
                            onClick={() => simulateWebhook("transfer.failed")}
                            disabled={loading}
                            variant="outline"
                            className="justify-start"
                        >
                            <div className="flex flex-col items-start">
                                <span className="font-semibold">transfer.failed</span>
                                <span className="text-xs text-muted-foreground">
                                    Simulate failed payout → Refunds to available balance
                                </span>
                            </div>
                        </Button>
                    </div>

                    {/* Instructions */}
                    <div className="mt-6 p-4 rounded-lg bg-muted">
                        <h4 className="font-semibold mb-2">Testing Flow:</h4>
                        <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                            <li>Create a payment link and get the payment reference</li>
                            <li>Use charge.success to lock funds in escrow</li>
                            <li>Mark delivery as confirmed in your app</li>
                            <li>System auto-initiates payout</li>
                            <li>Use transfer.success to mark payout complete</li>
                            <li>Check earnings dashboard for updated balances</li>
                        </ol>
                    </div>
                </CardContent>
            </Card>
        </main>
    )
}
