"use client"

import Link from "next/link"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Edit, Copy, MoreHorizontal, ExternalLink } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

interface LinkItem {
    id: string
    item_name: string
    short_code: string
    item_price: number
    images: string[]
    created_at: string
    status?: string
    views?: number
    sales_count?: number
}

interface LinksTableProps {
    links: LinkItem[]
}

export function LinksTable({ links }: LinksTableProps) {
    const copyLink = (shortCode: string) => {
        const url = `${window.location.origin}/pay/${shortCode}`
        navigator.clipboard.writeText(url)
        toast.success("Link copied to clipboard")
    }

    if (links.length === 0) {
        return (
            <div className="border border-border p-12 text-center rounded-lg">
                <p className="text-muted-foreground mb-4">No links created yet</p>
                <Link href="/dashboard/create">
                    <Button>Create your first link</Button>
                </Link>
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
                            <th className="text-left p-4 text-sm font-medium">Price</th>
                            <th className="text-left p-4 text-sm font-medium">Created</th>
                            <th className="text-right p-4 text-sm font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {links.map((link) => (
                            <tr key={link.id} className="hover:bg-secondary/20">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded overflow-hidden bg-secondary flex-shrink-0 border border-border">
                                            {link.images && link.images[0] ? (
                                                <img
                                                    src={link.images[0]}
                                                    alt={link.item_name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                                                    No Img
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium truncate max-w-[200px]">{link.item_name}</div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                {link.short_code}
                                                <button
                                                    onClick={() => copyLink(link.short_code)}
                                                    className="hover:text-primary transition-colors"
                                                    title="Copy Link"
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="font-medium">KES {Number(link.item_price).toLocaleString()}</div>
                                </td>
                                <td className="p-4 text-sm text-muted-foreground">
                                    {format(new Date(link.created_at), "MMM d, yyyy")}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Open menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => copyLink(link.short_code)}>
                                                    <Copy className="mr-2 h-4 w-4" />
                                                    Copy Link
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/pay/${link.short_code}`} target="_blank">
                                                        <ExternalLink className="mr-2 h-4 w-4" />
                                                        View Live Page
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/dashboard/links/${link.short_code}`}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/dashboard/links/${link.short_code}/edit`}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit Link
                                                    </Link>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
