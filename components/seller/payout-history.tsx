"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"
import { formatDistance } from "date-fns"

interface Payout {
    id: string
    amount: number
    currency: string
    status: "PENDING" | "SUCCESS" | "FAILED"
    transfer_reference: string | null
    created_at: string
    updated_at: string
}

interface PayoutHistoryResponse {
    success: boolean
    data: Payout[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
    error?: string
}

export function PayoutHistory() {
    const [payouts, setPayouts] = useState<Payout[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    })

    useEffect(() => {
        fetchPayouts()
    }, [page])

    const fetchPayouts = async () => {
        setLoading(true)
        setError(null)
        try {
            console.log('[PayoutHistory] Fetching payouts for page:', page)
            const response = await fetch(`/api/seller/payout-history?page=${page}&limit=20`)
            const data: PayoutHistoryResponse = await response.json()

            console.log('[PayoutHistory] Response:', data)

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch payouts')
            }

            if (data.success) {
                console.log('[PayoutHistory] Payouts received:', data.data.length)
                setPayouts(data.data)
                setPagination(data.pagination)
            } else {
                throw new Error('Unexpected response format')
            }
        } catch (error) {
            console.error("[PayoutHistory] Failed to fetch payout history:", error)
            setError(error instanceof Error ? error.message : "Failed to load payout history")
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: Payout["status"]) => {
        switch (status) {
            case "SUCCESS":
                return <Badge className="bg-green-500">Success</Badge>
            case "PENDING":
                return <Badge className="bg-yellow-500">Pending</Badge>
            case "FAILED":
                return <Badge variant="destructive">Failed</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Payout History</CardTitle>
                    <CardDescription>
                        View all your past payouts and their status
                    </CardDescription>
                </div>
                <Button variant="outline" size="icon" onClick={fetchPayouts} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <p className="text-destructive font-medium mb-2">Error loading payouts</p>
                        <p className="text-sm text-muted-foreground mb-4">{error}</p>
                        <Button variant="outline" onClick={fetchPayouts}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                        </Button>
                    </div>
                ) : payouts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No payouts yet</p>
                        <p className="text-sm mt-1">
                            Payouts are automatically processed when escrow is released
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Reference</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payouts.map((payout) => (
                                        <TableRow key={payout.id}>
                                            <TableCell className="font-medium">
                                                {formatDistance(new Date(payout.created_at), new Date(), {
                                                    addSuffix: true,
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                {payout.currency} {payout.amount.toLocaleString()}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(payout.status)}</TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {payout.transfer_reference || "N/A"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-muted-foreground">
                                    Page {pagination.page} of {pagination.totalPages} ({pagination.total}{" "}
                                    total)
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                                        disabled={page === pagination.totalPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    )
}
