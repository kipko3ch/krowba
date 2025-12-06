"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface PinVerificationProps {
    shortCode: string
}

export function PinVerification({ shortCode }: PinVerificationProps) {
    const [pin, setPin] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!pin) return

        setIsLoading(true)

        try {
            const response = await fetch("/api/verify-pin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ shortCode, pin }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Invalid PIN")
            }

            toast.success("Access granted")
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Invalid PIN")
            setPin("")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0a1208] flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-[#0d1a0f] border-[#44f91f]/20 shadow-xl shadow-[#44f91f]/5">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto bg-[#44f91f]/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                        <Lock className="h-6 w-6 text-[#44f91f]" />
                    </div>
                    <CardTitle className="text-2xl text-white">Protected Link</CardTitle>
                    <CardDescription className="text-gray-400">
                        This link is password protected. Please enter the PIN to continue.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            type="password"
                            placeholder="Enter PIN"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="bg-[#0a1208] border-[#44f91f]/30 text-white text-center text-lg tracking-widest focus:border-[#44f91f] focus:ring-[#44f91f]"
                            maxLength={6}
                            autoFocus
                        />
                        <Button
                            type="submit"
                            className="w-full bg-[#44f91f] hover:bg-[#3de018] text-black font-bold"
                            disabled={isLoading || !pin}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                "Unlock Link"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
