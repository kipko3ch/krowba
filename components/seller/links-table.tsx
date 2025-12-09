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
import { MoreHorizontal, Copy, ExternalLink, Trash2, Eye, QrCode, Truck, Edit } from "lucide-react"
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

const STATUS_FILTERS = [
    { label: "All", value: "all", color: "text-foreground", count: 0 },
    { label: "Active", value: "active", color: "text-[#44f91f]", count: 0 },
    { label: "Paid", value: "paid", color: "text-blue-500", count: 0 },
    { label: "Completed", value: "completed", color: "text-gray-500", count: 0 },
    { label: "Cancelled", value: "cancelled", color: "text-red-500", count: 0 },
]

export function LinksTable({ links, showTabs = false }: LinksTableProps) {
    const router = useRouter()
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [qrLink, setQrLink] = useState<KrowbaLink | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [activeFilter, setActiveFilter] = useState("all")

    // Calculate counts and filter links
    const statusCounts = links.reduce((acc, link) => {
        const status = link.status === 'sold' ? 'paid' : link.status
        acc[status] = (acc[status] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const filteredLinks = activeFilter === "all"
        ? links
        : links.filter(link => {
            const status = link.status === 'sold' ? 'paid' : link.status
            return status === activeFilter
        })

    STATUS_FILTERS[0].count = links.length
    STATUS_FILTERS[1].count = statusCounts['active'] || 0
    STATUS_FILTERS[2].count = statusCounts['paid'] || 0
    STATUS_FILTERS[3].count = statusCounts['completed'] || 0
    STATUS_FILTERS[4].count = statusCounts['cancelled'] || 0

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

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "bg-[#44f91f]/10 text-[#44f91f] border-[#44f91f]/20"
            case "paid":
                return "bg-blue-500/10 text-blue-500 border-blue-500/20"
            case "completed":
                return "bg-gray-500/10 text-gray-500 border-gray-500/20"
            case "cancelled":
                return "bg-red-500/10 text-red-500 border-red-500/20"
            default:
                return "bg-gray-500/10 text-gray-500 border-gray-500/20"
        }
    }

    if (links.length === 0) {
        return (
            <div className="text-center py-12 border border-dashed rounded-lg">
                <h3 className="text-lg font-medium">No links created yet</h3>
                <p className="text-muted-foreground mt-1">Create your first payment link to get started.</p>
            </div>
        )
    }

    return (
        <>
            {/* Status Filter Tabs */}
            {showTabs && (
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                    {STATUS_FILTERS.map((filter) => (
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
                                {filter.count}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            <div className="border rounded-lg overflow-hidden bg-card/50">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-b border-border">
                            <TableHead className="font-semibold">Item</TableHead>
                            <TableHead className="font-semibold">Price</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold">Created</TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLinks.map((link) => (
                            <TableRow key={link.id} className="border-b border-border/50 hover:bg-muted/30">
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span className="text-foreground">{link.item_name}</span>
                                        <span className="text-xs text-muted-foreground truncate max-w-[200px] font-mono">
                                            {link.short_code}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-foreground font-medium">
                                    KES {(link.item_price + link.delivery_fee).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1.5">
                                        <Badge variant="outline" className={getStatusColor(link.status)}>
                                            {link.status === 'sold' ? 'Paid' : link.status}
                                        </Badge>
                                        {link.status === 'sold' && (
                                            <Badge variant="secondary" className="text-xs">
                                                {link.shipping_status === 'shipped' ? 'Shipped' :
                                                    link.shipping_status === 'delivered' ? 'Delivered' : 'Ready to Ship'}
                                            </Badge>
                                        )}
                                        {(link as any).transactions && (link as any).transactions.some((tx: any) => tx.refund_status && tx.refund_status !== 'none') && (
                                            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 text-xs">
                                                {(link as any).transactions.find((tx: any) => tx.refund_status && tx.refund_status !== 'none')?.refund_status === 'processed' ? 'Refunded' : 'Refunding'}
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {new Date(link.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {link.status === 'sold' && link.shipping_status !== 'shipped' && link.shipping_status !== 'delivered' ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 border-primary/30 text-primary hover:bg-primary/10"
                                                onClick={() => router.push(`/dashboard/ship/${link.id}`)}
                                            >
                                                <Truck className="h-3.5 w-3.5 mr-1.5" />
                                                Ship
                                            </Button>
                                        ) : link.status === 'active' ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-muted-foreground"
                                                disabled
                                                title="Waiting for payment"
                                            >
                                                <Truck className="h-3.5 w-3.5 mr-1.5" />
                                                Ship
                                            </Button>
                                        ) : null}

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => copyToClipboard(`${window.location.origin}/pay/${link.short_code}`)}
                                            title="Copy Link"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {!(link.status === 'sold' && link.shipping_status === 'delivered') && (
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard/links/${link.short_code}/edit`}>
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit Link
                                                        </Link>
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/dashboard/links/${link.short_code}`}>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View Details
                                                    </Link>
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
                                                <DropdownMenuItem
                                                    className="text-red-500 focus:text-red-500"
                                                    onClick={() => setDeleteId(link.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete Link
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
