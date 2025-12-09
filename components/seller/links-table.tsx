"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Copy, ExternalLink, Trash2, Eye, QrCode, Truck, Edit, Info } from "lucide-react"
import { toast } from "sonner"
import { QRCodeSVG } from "qrcode.react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import type { KrowbaLink } from "@/types"
import { cn } from "@/lib/utils"

interface LinksTableProps {
    links: KrowbaLink[]
    showTabs?: boolean
}

const WORKFLOW_FILTERS = [
    { label: "All Orders", value: "all", color: "text-foreground" },
    { label: "Pending", value: "pending", color: "text-gray-500" },
    { label: "Awaiting Ship", value: "awaiting_ship", color: "text-blue-500" },
    { label: "On Transit", value: "on_transit", color: "text-yellow-500" },
    { label: "Delivered", value: "delivered", color: "text-[#44f91f]" },
    { label: "Rejected/Refunded", value: "rejected", color: "text-red-500" },
]

export function LinksTable({ links, showTabs = false }: LinksTableProps) {
    const router = useRouter()
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [qrLink, setQrLink] = useState<KrowbaLink | null>(null)
    const [detailsLink, setDetailsLink] = useState<KrowbaLink | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [activeFilter, setActiveFilter] = useState("all")

    // Helper to determine workflow stage
    const getWorkflowStage = (link: KrowbaLink) => {
        const hasRefund = (link as any).transactions?.some((tx: any) =>
            tx.refund_status && tx.refund_status !== 'none'
        )

        if (hasRefund) return 'rejected'

        if (!['sold', 'paid'].includes(link.status)) {
            return 'pending' // Active links not yet paid
        }

        if (link.status === 'sold' || link.status === 'paid') {
            if (link.shipping_status === 'delivered') return 'delivered'
            if (link.shipping_status === 'shipped') return 'on_transit'
            return 'awaiting_ship'
        }

        return 'pending'
    }

    // Filter links by workflow stage
    const filteredLinks = activeFilter === "all"
        ? links.filter(l => ['sold', 'paid'].includes(l.status)) // Only show paid orders
        : links.filter(link => getWorkflowStage(link) === activeFilter)

    // Calculate counts
    const workflowCounts = links.reduce((acc, link) => {
        const stage = getWorkflowStage(link)
        if (stage) acc[stage] = (acc[stage] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("Link copied to clipboard")
    }

    const handleDelete = async () => {
        if (!deleteId) return

        setIsDeleting(true)
        try {
            const response = await fetch(`/api/seller/delete-link?id=${deleteId}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to delete link")
            }

            toast.success("Link deleted successfully")
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete link")
        } finally {
            setIsDeleting(false)
            setDeleteId(null)
        }
    }

    const getStatusBadge = (link: KrowbaLink) => {
        const stage = getWorkflowStage(link)

        switch (stage) {
            case "awaiting_ship":
                return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Awaiting Ship</Badge>
            case "on_transit":
                return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">On Transit</Badge>
            case "delivered":
                return <Badge className="bg-[#44f91f]/10 text-[#44f91f] border-[#44f91f]/20">Delivered</Badge>
            case "rejected":
                return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Refunded</Badge>
            default:
                return <Badge variant="outline">Pending Payment</Badge>
        }
    }

    if (filteredLinks.length === 0) {
        return (
            <div className="text-center py-12 border border-dashed rounded-lg">
                <h3 className="text-lg font-medium">No orders found</h3>
                <p className="text-muted-foreground mt-1">
                    {activeFilter === "all" ? "No paid orders yet" : `No orders in ${WORKFLOW_FILTERS.find(f => f.value === activeFilter)?.label}`}
                </p>
            </div>
        )
    }

    return (
        <>
            {/* Workflow Filter Tabs */}
            {showTabs && (
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                    {WORKFLOW_FILTERS.map((filter) => {
                        const count = filter.value === "all"
                            ? links.filter(l => ['sold', 'paid'].includes(l.status)).length
                            : workflowCounts[filter.value] || 0

                        return (
                            <button
                                key={filter.value}
                                onClick={() => setActiveFilter(filter.value)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all whitespace-nowrap",
                                    activeFilter === filter.value
                                        ? "bg-card border-border shadow-sm"
                                        : "bg-transparent border-transparent hover:bg-muted/50"
                                )}
                            >
                                <span className={cn(
                                    "text-sm font-medium",
                                    activeFilter === filter.value ? filter.color : "text-muted-foreground"
                                )}>
                                    {filter.label}
                                </span>
                                <span className={cn(
                                    "text-xs px-2 py-0.5 rounded-full",
                                    activeFilter === filter.value
                                        ? cn("bg-muted", filter.color)
                                        : "bg-muted/50 text-muted-foreground"
                                )}>
                                    {count}
                                </span>
                            </button>
                        )
                    })}
                </div>
            )}

            <div className="border rounded-lg overflow-hidden bg-card/50">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-b border-border">
                            <TableHead className="font-semibold">Item</TableHead>
                            <TableHead className="font-semibold">Price</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold">Date</TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLinks.map((link) => (
                            <TableRow key={link.id} className="border-b border-border/50 hover:bg-muted/30">
                                <TableCell className="font-medium max-w-[200px]">
                                    <div className="flex flex-col">
                                        <span className="text-foreground truncate">{link.item_name}</span>
                                        <span className="text-xs text-muted-foreground font-mono">
                                            {link.short_code}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-foreground font-medium">
                                    KES {(link.item_price + link.delivery_fee).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                    {getStatusBadge(link)}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {new Date(link.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDetailsLink(link)}
                                            className="h-8"
                                        >
                                            <Info className="h-4 w-4 mr-1" />
                                            Details
                                        </Button>

                                        {getWorkflowStage(link) === 'awaiting_ship' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 border-primary/30 text-primary hover:bg-primary/10"
                                                onClick={() => router.push(`/dashboard/ship/${link.id}`)}
                                            >
                                                <Truck className="h-3.5 w-3.5 mr-1.5" />
                                                Ship
                                            </Button>
                                        )}

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => copyToClipboard(`${window.location.origin}/pay/${link.short_code}`)}>
                                                    <Copy className="h-4 w-4 mr-2" />
                                                    Copy Link
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/pay/${link.short_code}`} target="_blank">
                                                        <ExternalLink className="h-4 w-4 mr-2" />
                                                        View Public Page
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setQrLink(link)}>
                                                    <QrCode className="h-4 w-4 mr-2" />
                                                    Show QR Code
                                                </DropdownMenuItem>
                                                {/* CRITICAL: Cannot edit shipped or delivered items - unfair to buyers */}
                                                {getWorkflowStage(link) !== 'delivered' && getWorkflowStage(link) !== 'on_transit' && (
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard/links/${link.short_code}/edit`}>
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit Link
                                                        </Link>
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem
                                                    className="text-red-500 focus:text-red-500"
                                                    onClick={() => setDeleteId(link.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Details Dialog */}
            <Dialog open={!!detailsLink} onOpenChange={(open) => !open && setDetailsLink(null)}>
                <DialogContent className="bg-background border-border text-foreground sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Order Details</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Complete information for this order
                        </DialogDescription>
                    </DialogHeader>
                    {detailsLink && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground">Item Name</p>
                                    <p className="font-medium">{detailsLink.item_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Short Code</p>
                                    <p className="font-mono text-sm">{detailsLink.short_code}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground">Item Price</p>
                                    <p className="font-medium">KES {detailsLink.item_price.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Delivery Fee</p>
                                    <p className="font-medium">KES {detailsLink.delivery_fee.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground">Total Price</p>
                                    <p className="font-bold text-lg">KES {(detailsLink.item_price + detailsLink.delivery_fee).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Escrow Mode</p>
                                    <p className="font-medium capitalize">{detailsLink.escrow_mode?.replace('_', ' ')}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Status</p>
                                {getStatusBadge(detailsLink)}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground">Created</p>
                                    <p className="text-sm">{new Date(detailsLink.created_at).toLocaleString()}</p>
                                </div>
                                {detailsLink.expires_at && (
                                    <div>
                                        <p className="text-xs text-muted-foreground">Expires</p>
                                        <p className="text-sm">{new Date(detailsLink.expires_at).toLocaleString()}</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => copyToClipboard(`${window.location.origin}/pay/${detailsLink.short_code}`)}
                                >
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Link
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    asChild
                                >
                                    <Link href={`/dashboard/links/${detailsLink.short_code}`}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Full Details
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="bg-background border border-border text-foreground">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-foreground">Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            This action cannot be undone. This will permanently delete the link and all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* QR Code Dialog */}
            <Dialog open={!!qrLink} onOpenChange={(open) => !open && setQrLink(null)}>
                <DialogContent className="bg-background border-border text-foreground sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center text-xl">Scan to Pay</DialogTitle>
                        <DialogDescription className="text-center text-gray-400">
                            {qrLink?.item_name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center p-6 space-y-6">
                        <div className="bg-white p-4 rounded-xl">
                            {qrLink && (
                                <QRCodeSVG
                                    value={`${window.location.origin}/pay/${qrLink.short_code}`}
                                    size={200}
                                    level="H"
                                    includeMargin={true}
                                />
                            )}
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-sm text-muted-foreground">Scan with camera to view payment page</p>
                            <Button
                                variant="outline"
                                className="border-primary/30 text-primary hover:bg-primary/10"
                                onClick={() => {
                                    const svg = document.querySelector(".bg-white svg")
                                    if (svg) {
                                        const svgData = new XMLSerializer().serializeToString(svg)
                                        const canvas = document.createElement("canvas")
                                        const ctx = canvas.getContext("2d")
                                        const img = new Image()
                                        img.onload = () => {
                                            canvas.width = img.width
                                            canvas.height = img.height
                                            ctx?.drawImage(img, 0, 0)
                                            const pngFile = canvas.toDataURL("image/png")
                                            const downloadLink = document.createElement("a")
                                            downloadLink.download = `krowba-qr-${qrLink?.short_code}.png`
                                            downloadLink.href = pngFile
                                            downloadLink.click()
                                        }
                                        img.src = "data:image/svg+xml;base64," + btoa(svgData)
                                    }
                                }}
                            >
                                Download QR Code
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
