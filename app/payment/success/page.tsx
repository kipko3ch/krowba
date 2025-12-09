"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle2, ArrowRight, Package, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const reference = searchParams.get("ref")
    const [countdown, setCountdown] = useState(5)

    useEffect(() => {
        // Fire confetti
        const duration = 3 * 1000
        const animationEnd = Date.now() + duration
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now()

            if (timeLeft <= 0) {
                return clearInterval(interval)
            }

            const particleCount = 50 * (timeLeft / duration)
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } })
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } })
        }, 250)

        return () => clearInterval(interval)
    }, [])

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-border shadow-2xl">
                <CardContent className="pt-10 pb-8 px-8 text-center space-y-6">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", duration: 0.6 }}
                        className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto"
                    >
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </motion.div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold tracking-tight">Payment Successful!</h1>
                        <p className="text-muted-foreground">
                            Your funds are now securely held in Krowba Escrow.
                        </p>
                    </div>

                    <div className="bg-muted/50 rounded-xl p-4 space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Reference</span>
                            <span className="font-mono font-medium">{reference || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Status</span>
                            <span className="text-green-500 font-medium flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Secured
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3 pt-4">
                        <Button
                            className="w-full h-12 rounded-xl text-base"
                            onClick={() => router.push("/dashboard")}
                        >
                            Go to Dashboard
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
