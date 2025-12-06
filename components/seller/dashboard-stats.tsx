"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LinkIcon, DollarSign, Package, BarChart3, LayoutGrid } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { KrowbaLink } from "@/types"

interface DashboardStatsProps {
    links: KrowbaLink[]
}

export function DashboardStats({ links }: DashboardStatsProps) {
    const [viewMode, setViewMode] = useState<"stats" | "graph">("stats")

    const activeLinks = links.filter(l => l.status === "active")
    const completedLinks = links.filter(l => l.status === "completed")
    const potentialValue = activeLinks.reduce((sum, link) => sum + link.item_price, 0)

    const graphData = useMemo(() => {
        // Group by date
        const grouped = links.reduce((acc, link) => {
            const date = new Date(link.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            if (!acc[date]) {
                acc[date] = { date, value: 0, count: 0, originalDate: new Date(link.created_at) }
            }
            acc[date].value += link.item_price
            acc[date].count += 1
            return acc
        }, {} as Record<string, { date: string, value: number, count: number, originalDate: Date }>)

        return Object.values(grouped).sort((a, b) => a.originalDate.getTime() - b.originalDate.getTime())
    }, [links])

    return (
        <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Overview</h2>
                <div className="bg-muted/50 p-1 rounded-lg flex gap-1 border border-border">
                    <Button
                        variant={viewMode === "stats" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("stats")}
                        className="h-8 px-3 text-xs"
                    >
                        <LayoutGrid className="h-3.5 w-3.5 mr-1.5" /> Stats
                    </Button>
                    <Button
                        variant={viewMode === "graph" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("graph")}
                        className="h-8 px-3 text-xs"
                    >
                        <BarChart3 className="h-3.5 w-3.5 mr-1.5" /> Graph
                    </Button>
                </div>
            </div>

            {viewMode === "stats" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                    <Card className="bg-card border-border shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Active Links
                            </CardTitle>
                            <LinkIcon className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                            <div className="text-2xl font-bold text-foreground">{activeLinks.length}</div>
                            <p className="text-xs text-muted-foreground">
                                {links.length} total links
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Potential Value
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                            <div className="text-2xl font-bold text-foreground">
                                KES {potentialValue.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                From active links
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border shadow-sm col-span-2 md:col-span-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Completed Sales
                            </CardTitle>
                            <Package className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                            <div className="text-2xl font-bold text-foreground">{completedLinks.length}</div>
                            <p className="text-xs text-muted-foreground">
                                Successful transactions
                            </p>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <Card className="bg-card border-border shadow-sm animate-in fade-in zoom-in-95 duration-200">
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="text-lg font-medium text-foreground">Value Created Over Time</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0 h-[300px]">
                        {graphData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={graphData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#44f91f" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#44f91f" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1a2e1d" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#666"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#666"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `K${value >= 1000 ? value / 1000 + 'k' : value}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0a1208', borderColor: '#1a2e1d', color: '#ededed', borderRadius: '8px' }}
                                        itemStyle={{ color: '#44f91f' }}
                                        formatter={(value: number) => [`KES ${value.toLocaleString()}`, "Value"]}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#44f91f"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorValue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                No data available for graph
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
