import { Shield, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface TrustBadgeProps {
  status: "verified" | "warning" | "failed" | "pending"
  label?: string
  className?: string
}

const statusConfig = {
  verified: {
    icon: CheckCircle,
    text: "Verified",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  warning: {
    icon: AlertTriangle,
    text: "Needs Review",
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  failed: {
    icon: XCircle,
    text: "Failed",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  pending: {
    icon: Shield,
    text: "Pending",
    className: "bg-neutral-50 text-neutral-600 border-neutral-200",
  },
}

export function TrustBadge({ status, label, className }: TrustBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border",
        config.className,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label || config.text}</span>
    </div>
  )
}
