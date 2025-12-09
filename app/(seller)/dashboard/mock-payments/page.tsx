"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VirtualWalletCard } from "@/components/seller/virtual-wallet-card"
import { PayoutSimulator } from "@/components/seller/payout-simulator"
import { MockTransactionsTable } from "@/components/seller/mock-transactions-table"
import { Wallet, History, DollarSign } from "lucide-react"

export default function MockPaymentsPage() {
    const [transactions, setTransactions] = useState([])
    const [wallet, setWallet] = useState({ pending: 0, available: 0, refunded: 0, paid: 0 })
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [txResponse, walletResponse] = await Promise.all([
                fetch("/api/mock/transactions"),
                fetch("/api/mock/wallet"),
            ])

            const txData = await txResponse.json()
            const walletData = await walletResponse.json()

            if (txData.success) setTransactions(txData.data)
            if (walletData.success) setWallet(walletData.data)
        } catch (error) {
            console.error("Failed to fetch data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2">Mock Payment System</h1>
                <p className="text-muted-foreground">
                    Test payment flows, escrow management, and payouts without real transactions
                </p>
            </div>

            {/* Virtual Wallet */}
            <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Virtual Wallet
                </h2>
                <VirtualWalletCard />
            </div>

            {/* Payout Simulator */}
            <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Payout Simulator
                </h2>
                <PayoutSimulator availableBalance={wallet.available} onSuccess={fetchData} />
            </div>

            {/* Transactions */}
            <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Transaction History
                </h2>
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                        <CardDescription>View all mock payment transactions and their statuses</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-12">
                                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                                <p className="mt-4 text-muted-foreground">Loading transactions...</p>
                            </div>
                        ) : (
                            <MockTransactionsTable transactions={transactions} />
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Info Box */}
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6">
                    <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">About Test Mode</h3>
                    <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                        <li>• Card payments have an 80% success rate (use 4242 4242 4242 4242 for guaranteed success)</li>
                        <li>• Mobile payments have an 85% success rate</li>
                        <li>• All transactions are simulated with random delays (500ms - 3000ms)</li>
                        <li>• Payouts move funds from Available → Paid Out</li>
                        <li>• No real money is charged or transferred</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    )
}
