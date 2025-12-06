import { Check, Clock, Package, Truck, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface TimelineStep {
  label: string
  status: "completed" | "current" | "pending" | "failed"
  timestamp?: string
}

interface StatusTimelineProps {
  steps: TimelineStep[]
  className?: string
}

const iconMap = {
  "Payment Received": Check,
  "Order Confirmed": CheckCircle2,
  Shipped: Truck,
  "In Transit": Package,
  Delivered: CheckCircle2,
  "Funds Released": Check,
  Disputed: XCircle,
}

export function StatusTimeline({ steps, className }: StatusTimelineProps) {
  return (
    <div className={cn("relative", className)}>
      {steps.map((step, index) => {
        const Icon = iconMap[step.label as keyof typeof iconMap] || Clock
        const isLast = index === steps.length - 1

        return (
          <div key={index} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2",
                  step.status === "completed" && "bg-black border-black text-white",
                  step.status === "current" && "bg-white border-black text-black",
                  step.status === "pending" && "bg-neutral-100 border-neutral-300 text-neutral-400",
                  step.status === "failed" && "bg-red-100 border-red-500 text-red-600",
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              {!isLast && (
                <div className={cn("w-0.5 h-8", step.status === "completed" ? "bg-black" : "bg-neutral-200")} />
              )}
            </div>
            <div className="pb-8">
              <p
                className={cn(
                  "font-medium",
                  step.status === "pending" && "text-neutral-400",
                  step.status === "failed" && "text-red-600",
                )}
              >
                {step.label}
              </p>
              {step.timestamp && <p className="text-sm text-neutral-500">{step.timestamp}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
