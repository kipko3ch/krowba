"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Wallet } from "lucide-react"

interface Earnings {
    pending_escrow_balance: number
    available_balance: number
    total_paid_out: number
}

export function EarningsOverview() {
    const [earnings, setEarnings] = useState<Earnings>({
        pending_escrow_balance: 0,
        available_balance: 0,
        total_paid_out: 0,
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchEarnings()
    }, [])

    const fetchEarnings = async () => {
        try {
            const response = await fetch("/api/seller/earnings")
            const data = await response.json()

            if (data.success) {
                setEarnings(data.data)
            }
        } catch (error) {
            console.error("Failed to fetch earnings:", error)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return `KES ${amount.toLocaleString()}`
    }

    const stats = [
        {
            title: "Pending Escrow",
            value: earnings.pending_escrow_balance,
            description: "Funds locked in escrow",
            icon: Wallet,
            color: "text-yellow-600 dark:text-yellow-400",
            bgColor: "bg-yellow-100 dark:bg-yellow-950/30",
        },
        {
            title: "Available Balance",
            value: earnings.available_balance,
            description: "Ready for payout",
            icon: DollarSign,
            color: "text-green-600 dark:text-green-400",
            bgColor: "bg-green-100 dark:bg-green-950/30",
        },
        {
            title: "Total Paid Out",
            value: earnings.total_paid_out,
            description: "Lifetime earnings",
            icon: TrendingUp,
            color: "text-blue-600 dark:text-blue-400",
            bgColor: "bg-blue-100 dark:bg-blue-950/30",
        },
    ]

    return (
        <div className="grid gap-4 md:grid-cols-3">
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
