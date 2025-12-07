"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function PageLoadingSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header skeleton */}
            <div className="flex items-center justify-between mb-8">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Stats cards skeleton */}
            <div className="grid gap-4 md:grid-cols-3 mb-8">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
            </div>

            {/* Large content skeleton */}
            <div className="space-y-4">
                <Skeleton className="h-64" />
                <Skeleton className="h-48" />
                <Skeleton className="h-32" />
            </div>
        </div>
    )
}
