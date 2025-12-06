"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react"

interface Transaction {
    id: string
    amount: number
    status: string
    created_at: string
    buyer_name: string
    seller_id: string
    krowba_link_id: string
    escrow_status: string // 'held', 'released', 'refunded'
    paystack_reference: string
}

export default function AdminDashboard() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchTransactions()
    }, [])

    const fetchTransactions = async () => {
        try {
            const { data, error } = await supabase
                .from("transactions")
                .select("*")
                .order("created_at", { ascending: false })

            if (error) throw error
            setTransactions(data || [])
        } catch (error) {
            console.error("Error fetching transactions:", error)
            toast.error("Failed to load transactions")
        } finally {
            setIsLoading(false)
        }
    }

    const handleReleaseFunds = async (transaction: Transaction) => {
        if (!confirm(`Are you sure you want to release KES ${transaction.amount} to the seller?`)) return

        setProcessingId(transaction.id)
        try {
            const response = await fetch("/api/admin/release-funds", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transaction_id: transaction.id }),
            })

            const result = await response.json()

            if (!response.ok) throw new Error(result.error || "Failed to release funds")

            toast.success("Funds released successfully")
            fetchTransactions() // Refresh list
        } catch (error) {
            console.error("Release error:", error)
            toast.error(error instanceof Error ? error.message : "Failed to release funds")
        } finally {
            setProcessingId(null)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard - Escrow Management</h1>

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Buyer</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Escrow</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No transactions found
                                </TableCell>
                            </TableRow>
                        ) : (
                            transactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell>{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>{tx.buyer_name}</TableCell>
                                    <TableCell>KES {tx.amount.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={tx.status === "success" ? "default" : "secondary"}>
                                            {tx.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={
                                                tx.escrow_status === "released"
                                                    ? "border-green-500 text-green-500"
                                                    : tx.escrow_status === "held"
                                                        ? "border-yellow-500 text-yellow-500"
                                                        : ""
                                            }
                                        >
                                            {tx.escrow_status || "pending"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {tx.status === "success" && (tx.escrow_status === "held" || !tx.escrow_status) && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleReleaseFunds(tx)}
                                                disabled={!!processingId}
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                {processingId === tx.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <CheckCircle2 className="h-4 w-4 mr-1" /> Release
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                        {tx.escrow_status === "released" && (
                                            <span className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                                                <CheckCircle2 className="h-3 w-3" /> Released
                                            </span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
