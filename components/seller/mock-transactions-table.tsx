"use client"

import Link from "next/link"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Truck, Package, CreditCard, Smartphone } from "lucide-react"
import { WalletStatusBadge } from "@/components/shared/wallet-status-badge"
import type { WalletBalanceType } from "@/types"

interface TransactionWithRelations {
    id: string
    buyer_phone: string
    buyer_name: string | null
    amount: number
    status: string
    payment_type: string
    payment_method: string | null
    payment_reference: string | null
    created_at: string
    krowba_links: {
        id: string
        item_name: string
        short_code: string
        images: string[]
        shipping_status: string | null
        shipping_proof_url: string | null
    } | null
    escrow_holds: {
        amount: number
        status: string
    }[]
    shipping_proofs: {
        courier_name: string
        dispatched_at: string
    }[]
}

interface MockTransactionsTableProps {
    transactions: TransactionWithRelations[]
}

export function MockTransactionsTable({ transactions }: MockTransactionsTableProps) {
    const getWalletStatus = (tx: TransactionWithRelations): WalletBalanceType => {
        const escrowStatus = tx.escrow_holds?.[0]?.status

        if (escrowStatus === "refunded" || tx.status === "refunded") return "refunded"
        if (escrowStatus === "released") return "available"
        if (escrowStatus === "held") return "pending"
        if (tx.status === "completed") return "pending"

        return "pending"
    }

    const getPaymentMethodIcon = (method: string | null) => {
        if (method === "card") {
            return <CreditCard className="h-4 w-4" />
        }
        return <Smartphone className="h-4 w-4" />
    }

    const getDeliveryStatus = (tx: TransactionWithRelations) => {
        if (tx.krowba_links?.shipping_status === "shipped" || tx.krowba_links?.shipping_status === "delivered") {
            return (
                <div className="flex items-center gap-1 text-sm">
                    <Truck className="h-4 w-4 text-green-600" />
                    <span>{tx.krowba_links.shipping_status === "delivered" ? "Delivered" : "Shipped"}</span>
                </div>
            )
        }

        if (tx.shipping_proofs.length > 0) {
            return (
                <div className="flex items-center gap-1 text-sm">
                    <Truck className="h-4 w-4 text-green-600" />
                    <span>Shipped</span>
                </div>
            )
        }

        const heldEscrow = tx.escrow_holds.find((e) => e.status === "held")
        if (heldEscrow) {
            return (
                <div className="flex items-center gap-1 text-sm">
                    <Package className="h-4 w-4 text-yellow-600" />
                    <span>Awaiting Dispatch</span>
                </div>
            )
        }

        return <span className="text-sm text-muted-foreground">-</span>
    }

    if (transactions.length === 0) {
        return (
            <div className="border border-border p-12 text-center">
                <p className="text-muted-foreground mb-4">No transactions yet</p>
                <p className="text-sm text-muted-foreground">Transactions will appear here when buyers pay through your links</p>
            </div>
        )
    }

    return (
        <div className="border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="border-b border-border bg-secondary/30">
                        <tr>
                            <th className="text-left p-4 text-sm font-medium">Item</th>
                            <th className="text-left p-4 text-sm font-medium">Buyer</th>
                            <th className="text-left p-4 text-sm font-medium">Amount</th>
                            <th className="text-left p-4 text-sm font-medium">Method</th>
                            <th className="text-left p-4 text-sm font-medium">Reference</th>
                            <th className="text-left p-4 text-sm font-medium">Status</th>
                            <th className="text-left p-4 text-sm font-medium">Delivery</th>
                            <th className="text-left p-4 text-sm font-medium">Date</th>
                            <th className="text-right p-4 text-sm font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-secondary/20">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        {tx.krowba_links?.images[0] && (
                                            <img
                                                src={tx.krowba_links.images[0] || "/placeholder.svg"}
                                                alt=""
                                                className="h-10 w-10 object-cover border border-border rounded"
                                            />
                                        )}
                                        <div>
                                            <div className="font-medium">{tx.krowba_links?.item_name || "Unknown"}</div>
                                            <div className="text-xs text-muted-foreground">{tx.krowba_links?.short_code}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="font-medium">{tx.buyer_name || "-"}</div>
                                    <div className="text-sm text-muted-foreground">{tx.buyer_phone}</div>
                                </td>
                                <td className="p-4">
                                    <div className="font-medium">KES {Number(tx.amount).toLocaleString()}</div>
                                    <div className="text-xs text-muted-foreground capitalize">{tx.payment_type}</div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        {getPaymentMethodIcon(tx.payment_method)}
                                        <span className="text-sm capitalize">{tx.payment_method || "mobile"}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <code className="text-xs bg-muted px-2 py-1 rounded">
                                        {tx.payment_reference?.substring(0, 20) || "N/A"}
                                        {tx.payment_reference && tx.payment_reference.length > 20 ? "..." : ""}
                                    </code>
                                </td>
                                <td className="p-4">
                                    <WalletStatusBadge status={getWalletStatus(tx)} />
                                </td>
                                <td className="p-4">{getDeliveryStatus(tx)}</td>
                                <td className="p-4 text-sm text-muted-foreground">{format(new Date(tx.created_at), "MMM d, yyyy")}</td>
                                <td className="p-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link href={`/dashboard/links/${tx.krowba_links?.short_code}`}>
                                            <Button variant="ghost" size="icon">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        {tx.status === "completed" &&
                                            (tx.krowba_links?.shipping_status !== "shipped" &&
                                                tx.krowba_links?.shipping_status !== "delivered" &&
                                                tx.shipping_proofs.length === 0 ? (
                                                <Link href={`/dashboard/ship/${tx.krowba_links?.id || tx.id}`}>
                                                    <Button size="sm" className="bg-[#44f91f] hover:bg-[#3de018] text-black">
                                                        <Truck className="h-4 w-4 mr-2" />
                                                        Ship
                                                    </Button>
                                                </Link>
                                            ) : (
                                                <Button size="sm" variant="secondary" disabled className="opacity-70">
                                                    <Truck className="h-4 w-4 mr-2" />
                                                    Shipped
                                                </Button>
                                            ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
