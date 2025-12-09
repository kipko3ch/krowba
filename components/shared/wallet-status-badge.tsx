import { Badge } from "@/components/ui/badge"
import { Wallet, DollarSign, RefreshCw, TrendingUp } from "lucide-react"
import type { WalletBalanceType } from "@/types"

interface WalletStatusBadgeProps {
    status: WalletBalanceType
    className?: string
    showIcon?: boolean
}

export function WalletStatusBadge({ status, className = "", showIcon = true }: WalletStatusBadgeProps) {
    const config = {
        pending: {
            label: "Pending",
            className: "bg-yellow-100 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
            icon: Wallet,
        },
        available: {
            label: "Available",
            className: "bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800",
            icon: DollarSign,
        },
        refunded: {
            label: "Refunded",
            className: "bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
            icon: RefreshCw,
        },
        paid: {
            label: "Paid",
            className: "bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
            icon: TrendingUp,
        },
    }

    const { label, className: statusClass, icon: Icon } = config[status]

    return (
        <Badge variant="outline" className={`${statusClass} ${className} flex items-center gap-1.5`}>
            {showIcon && <Icon className="h-3 w-3" />}
            {label}
        </Badge>
    )
}
