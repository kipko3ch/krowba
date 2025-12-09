"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, DollarSign, RefreshCw, TrendingUp } from "lucide-react"
import type { VirtualWallet } from "@/types"

export function VirtualWalletCard() {
    const [wallet, setWallet] = useState<VirtualWallet>({
        pending: 0,
        available: 0,
        refunded: 0,
        paid: 0,
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchWallet()
    }, [])

    const fetchWallet = async () => {
        try {
            const response = await fetch("/api/mock/wallet")
            const data = await response.json()

            if (data.success) {
                setWallet(data.data)
            }
        } catch (error) {
            console.error("Failed to fetch wallet:", error)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return `KES ${amount.toLocaleString()}`
    }

    const stats = [
        {
            title: "Pending (Escrow)",
            value: wallet.pending,
            description: "Locked in escrow",
            icon: Wallet,
            color: "text-yellow-600 dark:text-yellow-400",
            bgColor: "bg-yellow-100 dark:bg-yellow-950/30",
        },
        {
            title: "Available",
            value: wallet.available,
            description: "Ready for payout",
            icon: DollarSign,
            color: "text-[#44f91f] dark:text-[#44f91f]",
            bgColor: "bg-green-100 dark:bg-green-950/30",
        },
        {
            title: "Refunded",
            value: wallet.refunded,
            description: "Returned to buyers",
            icon: RefreshCw,
            color: "text-red-600 dark:text-red-400",
            bgColor: "bg-red-100 dark:bg-red-950/30",
        },
        {
            title: "Paid Out",
            value: wallet.paid,
            description: "Total withdrawn",
            icon: TrendingUp,
            color: "text-blue-600 dark:text-blue-400",
            bgColor: "bg-blue-100 dark:bg-blue-950/30",
        },
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
                <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                        <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? (
                                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                            ) : (
                                formatCurrency(stat.value)
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
