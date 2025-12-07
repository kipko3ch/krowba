"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    ArrowLeft,
    Copy,
    ExternalLink,
    Edit,
    QrCode,
    Shield,
    AlertTriangle,
    Clock,
    CheckCircle2,
    XCircle,
    Truck,
    DollarSign
} from "lucide-react"
import { toast } from "sonner"
import { QRCodeSVG } from "qrcode.react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import type { KrowbaLink, Transaction } from "@/types"

interface LinkDetailsProps {
    link: KrowbaLink
    transactions: Transaction[]
    escrowHolds: any[]
    shippingProofs: any[]
}

export function LinkDetails({ link, transactions, escrowHolds, shippingProofs }: LinkDetailsProps) {
    const router = useRouter()
    const [showQr, setShowQr] = useState(false)

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("Copied to clipboard")
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "bg-green-500/10 text-green-500 border-green-500/20"
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

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link href="/dashboard/links" className="hover:text-primary transition-colors flex items-center">
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back to Links
                        </Link>
                        <span>/</span>
                        <span>{link.short_code}</span>
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">{link.item_name}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-[#44f91f]/30 text-[#44f91f] hover:bg-[#44f91f]/10"
                        onClick={() => setShowQr(true)}
                    >
                        <QrCode className="h-4 w-4 mr-2" />
                        QR Code
                    </Button>
                    {!(link.status === 'sold' && link.shipping_status === 'delivered') && (
                        <Link href={`/dashboard/links/${link.short_code}/edit`}>
                            <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        </Link>
                    )}
                    <Link href={`/pay/${link.short_code}`} target="_blank">
                        <Button size="sm" className="bg-[#44f91f] hover:bg-[#3de018] text-black font-bold">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Page
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Sold/Shipped Banner */}
            {link.status === 'sold' && (
                <div className={`border rounded-xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 ${link.shipping_status === 'delivered'
                    ? 'bg-blue-500/10 border-blue-500/20'
                    : link.shipping_status === 'shipped'
                        ? 'bg-purple-500/10 border-purple-500/20'
                        : 'bg-green-500/10 border-green-500/20'
                    }`}>
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${link.shipping_status === 'delivered'
                        ? 'bg-blue-500/20'
                        : link.shipping_status === 'shipped'
                            ? 'bg-purple-500/20'
                            : 'bg-green-500/20'
                        }`}>
                        {link.shipping_status === 'delivered' ? (
                            <CheckCircle2 className="h-6 w-6 text-blue-500" />
                        ) : link.shipping_status === 'shipped' ? (
                            <Truck className="h-6 w-6 text-purple-500" />
                        ) : (
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                        )}
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${link.shipping_status === 'delivered'
                            ? 'text-blue-500'
                            : link.shipping_status === 'shipped'
                                ? 'text-purple-500'
                                : 'text-green-500'
                            }`}>
                            {link.shipping_status === 'delivered'
                                ? 'Order Completed'
                                : link.shipping_status === 'shipped'
                                    ? 'Item Shipped'
                                    : 'Item Sold!'}
                        </h3>
                        <p className={`text-sm ${link.shipping_status === 'delivered'
                            ? 'text-blue-600/80 dark:text-blue-400/80'
                            : link.shipping_status === 'shipped'
                                ? 'text-purple-600/80 dark:text-purple-400/80'
                                : 'text-green-600/80 dark:text-green-400/80'
                            }`}>
                            {link.shipping_status === 'delivered'
                                ? 'The buyer has confirmed receipt. Funds have been released.'
                                : link.shipping_status === 'shipped'
                                    ? 'You have shipped this item. Waiting for buyer confirmation.'
                                    : 'This item has been purchased. Please proceed to ship it to the buyer.'}
                        </p>
                    </div>
                    <div className="ml-auto">
                        {link.shipping_status !== 'shipped' && link.shipping_status !== 'delivered' && (
                            <Link href={`/dashboard/ship/${link.id}`}>
                                <Button className="bg-green-600 hover:bg-green-700 text-white border-none">
                                    <Truck className="h-4 w-4 mr-2" />
                                    Ship Item
                                </Button>
                            </Link>
                        )}
                        {link.shipping_status === 'shipped' && (
                            <Button variant="outline" disabled className="border-purple-500/30 text-purple-500">
                                <Truck className="h-4 w-4 mr-2" />
                                Shipped
                            </Button>
                        )}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Link Info */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center justify-between">
                                <span>Link Details</span>
                                <Badge variant="outline" className={getStatusColor(link.status)}>
                                    {link.status.toUpperCase()}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Price</p>
                                    <p className="text-xl font-bold text-foreground">KES {link.item_price.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Delivery Fee</p>
                                    <p className="text-xl font-bold text-foreground">
                                        {link.delivery_fee > 0 ? `KES ${link.delivery_fee.toLocaleString()}` : "Free"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Escrow Mode</p>
                                    <div className="flex items-center gap-2">
                                        {link.escrow_mode === "full_escrow" ? (
                                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                                <Shield className="h-3 w-3 mr-1" /> Full Escrow
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                                                <AlertTriangle className="h-3 w-3 mr-1" /> Split Risk
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Created At</p>
                                    <div className="flex items-center gap-2 text-foreground">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        {new Date(link.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-border" />

                            <div>
                                <p className="text-sm text-muted-foreground mb-2">Public Link URL</p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 bg-muted p-3 rounded border border-border text-primary font-mono text-sm truncate">
                                        {`${window.location.origin}/pay/${link.short_code}`}
                                    </code>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyToClipboard(`${window.location.origin}/pay/${link.short_code}`)}
                                        className="border-border hover:bg-muted text-primary"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {link.access_pin && (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Security PIN</p>
                                    <code className="bg-muted px-3 py-1 rounded border border-border text-foreground font-mono text-sm">
                                        {link.access_pin}
                                    </code>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Share this PIN with the buyer securely.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Images Preview */}
                    {link.images && link.images.length > 0 && (
                        <Card className="bg-card border-border">
                            <CardHeader>
                                <CardTitle className="text-foreground">Product Images</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {link.images.map((img, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                                            <img src={img} alt={`Product ${idx + 1}`} className="object-cover w-full h-full" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column: Activity */}
                <div className="space-y-6">
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-foreground">Transaction History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {transactions.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No transactions yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {transactions.map((tx) => (
                                        <div key={tx.id} className="flex items-start gap-3 p-3 rounded bg-muted/50 border border-border">
                                            <div className={`mt-1 p-1 rounded-full ${tx.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                                                tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                                                    'bg-red-500/20 text-red-500'
                                                }`}>
                                                {tx.status === 'completed' ? <CheckCircle2 className="h-3 w-3" /> :
                                                    tx.status === 'pending' ? <Clock className="h-3 w-3" /> :
                                                        <XCircle className="h-3 w-3" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-foreground">
                                                    {tx.status === 'completed' ? 'Payment Received' : 'Payment Initiated'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    KES {tx.amount.toLocaleString()} • {new Date(tx.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Shipping Status (Placeholder for now) */}
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-foreground">Shipping Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-muted-foreground">
                                <Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>No shipping updates</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* QR Code Dialog */}
            <Dialog open={showQr} onOpenChange={setShowQr}>
                <DialogContent className="bg-background border-border text-foreground sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center text-xl">Scan to Pay</DialogTitle>
                        <DialogDescription className="text-center text-muted-foreground">
                            {link.item_name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center p-6 space-y-6">
                        <div className="bg-white p-4 rounded-xl">
                            <QRCodeSVG
                                value={`${window.location.origin}/pay/${link.short_code}`}
                                size={200}
                                level="H"
                                includeMargin={true}
                            />
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
                                            downloadLink.download = `krowba-qr-${link.short_code}.png`
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
        </div>
    )
}
