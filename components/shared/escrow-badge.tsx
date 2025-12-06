import { Lock, Unlock } from "lucide-react"
import { cn } from "@/lib/utils"

interface EscrowBadgeProps {
  mode: "full_escrow" | "split_risk"
  className?: string
}

export function EscrowBadge({ mode, className }: EscrowBadgeProps) {
  const isFullEscrow = mode === "full_escrow"

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border",
        isFullEscrow ? "bg-black text-white border-black" : "bg-neutral-100 text-neutral-700 border-neutral-300",
        className,
      )}
    >
      {isFullEscrow ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
      <span>{isFullEscrow ? "Full Escrow" : "Split Risk"}</span>
    </div>
  )
}
