import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'bg-muted/60 dark:bg-muted animate-pulse rounded-md relative overflow-hidden',
        'before:absolute before:inset-0',
        'before:-translate-x-full',
        'before:animate-shimmer',
        'before:bg-gradient-to-r',
        'before:from-transparent before:via-gray-400/30 dark:before:via-white/10 before:to-transparent',
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
