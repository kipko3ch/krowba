"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { DollarSign, Loader2, TrendingUp, Sparkles } from "lucide-react"
import { toast } from "sonner"
import confetti from "canvas-confetti"

interface PayoutSimulatorProps {
    availableBalance: number
    onSuccess?: () => void
}

export function PayoutSimulator({ availableBalance, onSuccess }: PayoutSimulatorProps) {
    const [isProcessing, setIsProcessing] = useState(false)
    const [isPending, startTransition] = useTransition()

    const handlePayout = async () => {
        if (availableBalance <= 0) {
            toast.error("No available balance to payout")
            return
        }

        setIsProcessing(true)

        try {
            const response = await fetch("/api/mock/payouts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}), // Payout all available balance
            })

            const result = await response.json()

            if (!response.ok || !result.success) {
                throw new Error(result.error || "Payout failed")
            }

            // Success animation
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ["#44f91f", "#3de018", "#2dd010"],
            })

            toast.success(result.data.message)

            // Trigger parent refresh
            startTransition(() => {
                onSuccess?.()
            })
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to process payout")
        } finally {
            setIsProcessing(false)
        }
    }

    const isDisabled = availableBalance <= 0 || isProcessing

    return (
        <Card className="border-[#44f91f]/30 bg-gradient-to-br from-green-50 to-transparent dark:from-green-950/20 dark:to-transparent">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#44f91f]" />
                    Request Payout
                </CardTitle>
                <CardDescription>Withdraw your available balance (Test Mode)</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="bg-card border border-border rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
                    <p className="text-3xl font-bold text-[#44f91f]">KES {availableBalance.toLocaleString()}</p>
                </div>
            </CardContent>
            <CardFooter>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button className="w-full bg-[#44f91f] hover:bg-[#3de018] text-black font-bold" size="lg" disabled={isDisabled}>
                            {isProcessing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Withdraw Funds
                                </>
                            )}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Payout</AlertDialogTitle>
                            <AlertDialogDescription>
                                You are about to withdraw <strong>KES {availableBalance.toLocaleString()}</strong> from your available balance.
                                This is a simulated payout and will move funds to your "Paid Out" balance.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handlePayout}
                                className="bg-[#44f91f] hover:bg-[#3de018] text-black"
                            >
                                Confirm Payout
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    )
}
