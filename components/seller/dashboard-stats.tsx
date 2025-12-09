"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, LayoutGrid, BarChart3, LinkIcon, DollarSign, Package, TrendingUp, TrendingDown, HelpCircle } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { KrowbaLink } from "@/types"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface DashboardStatsProps {
    links: KrowbaLink[]
}

export function DashboardStats({ links }: DashboardStatsProps) {
    const [viewMode, setViewMode] = useState<"stats" | "graph">("stats") // Default to stats view
    const [isFlipping, setIsFlipping] = useState(false)

    const activeLinks = links.filter(l => l.status === "active")
    const completedLinks = links.filter(l => ["sold", "paid", "completed"].includes(l.status))
    const potentialValue = activeLinks.reduce((sum, link) => sum + link.item_price, 0)
    const completedValue = completedLinks.reduce((sum, link) => sum + link.item_price, 0)

    // Calculate Sales Performance (Today vs Yesterday)
    const { salesToday, salesYesterday, percentageChange, isPositive } = useMemo(() => {
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        const isSameDay = (d1: Date, d2: Date) =>
            d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear()

        const todayTotal = links
            .filter(l => ["sold", "paid", "completed"].includes(l.status) && isSameDay(new Date(l.created_at), today))
            .reduce((sum, l) => sum + l.item_price, 0)

        const yesterdayTotal = links
            .filter(l => ["sold", "paid", "completed"].includes(l.status) && isSameDay(new Date(l.created_at), yesterday))
            .reduce((sum, l) => sum + l.item_price, 0)

        let pctChange = 0
        if (yesterdayTotal > 0) {
            pctChange = ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100
        } else if (todayTotal > 0) {
            pctChange = 100
        }

        return {
            salesToday: todayTotal,
            salesYesterday: yesterdayTotal,
            percentageChange: Math.abs(pctChange).toFixed(1),
            isPositive: pctChange >= 0
        }
    }, [links])

    // Data for Main Graph (Sales over time)
    const graphData = useMemo(() => {
        const grouped = links.reduce((acc, link) => {
            const linkDate = new Date(link.created_at)
            const dateKey = linkDate.toISOString().split('T')[0]
            const displayDate = linkDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

            if (!acc[dateKey]) {
                acc[dateKey] = {
                    date: displayDate,
                    value: 0,
                    count: 0,
                    originalDate: linkDate,
                    key: dateKey
                }
            }
            acc[dateKey].value += link.item_price
            acc[dateKey].count += 1
            return acc
        }, {} as Record<string, { date: string, value: number, count: number, originalDate: Date, key: string }>)

        const sorted = Object.values(grouped).sort((a, b) => a.originalDate.getTime() - b.originalDate.getTime())

        if (sorted.length < 2) {
            return [
                { date: 'Start', value: 0, count: 0, key: 'start', originalDate: new Date(0) },
                ...sorted
            ]
        }
        return sorted
    }, [links])

    // Radial Chart Data
    const radialData = [
        {
            name: 'Performance',
            uv: Math.min(100, (salesToday / (salesYesterday || 1)) * 100) || 0,
            fill: '#44f91f',
        },
    ]

    const handleViewToggle = (mode: "stats" | "graph") => {
        if (mode !== viewMode) {
            setIsFlipping(true)
            setTimeout(() => {
                setViewMode(mode)
                setTimeout(() => setIsFlipping(false), 50)
            }, 150)
        }
    }

    return (
        <div className="space-y-6 mb-8">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Overview</h2>
                <div className="bg-muted/50 p-1 rounded-lg flex gap-1 border border-border">
                    <Button
                        variant={viewMode === "stats" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => handleViewToggle("stats")}
                        className="h-8 px-3 text-xs"
                    >
                        <LayoutGrid className="h-3.5 w-3.5 mr-1.5" /> Stats
                    </Button>
                    <Button
                        variant={viewMode === "graph" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => handleViewToggle("graph")}
                        className="h-8 px-3 text-xs"
                    >
                        <BarChart3 className="h-3.5 w-3.5 mr-1.5" /> Graph
                    </Button>
                </div>
            </div>

            <div
                className={cn(
                    "transition-all duration-300 ease-out",
                    isFlipping && "opacity-0 scale-95"
                )}
                style={{
                    transformStyle: "preserve-3d",
                    transition: "transform 0.3s ease-out, opacity 0.3s ease-out"
                }}
            >
                {viewMode === "stats" ? (
                    <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-6">
                        <div className="grid grid-cols-2 gap-4 md:contents">
                            {/* CARD 1: ACTIVE LINKS */}
                            <Card className="relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-border shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                                {/* Creative Watermark */}
                                <div className="absolute -right-8 -top-8 opacity-[0.03] dark:opacity-[0.05]">
                                    <LinkIcon className="h-32 w-32 text-[#44f91f] rotate-12" />
                                </div>
                                <div className="absolute -right-4 bottom-0 opacity-[0.02] dark:opacity-[0.03]">
                                    <div className="text-[120px] font-bold text-[#44f91f]">{activeLinks.length}</div>
                                </div>

                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6 relative z-10">
                                    <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Active</CardTitle>
                                    <div className="p-2 rounded-lg bg-[#44f91f]/10">
                                        <LinkIcon className="h-4 w-4 text-[#44f91f]" />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 md:p-6 md:pt-0 relative z-10">
                                    <div className="text-2xl md:text-3xl font-bold text-foreground">{activeLinks.length}</div>
                                    <p className="text-xs text-muted-foreground mt-1 hidden md:block">
                                        {links.length} total links
                                    </p>
                                    <div className="mt-4 pt-4 border-t border-border hidden md:block">
                                        <Link href="/dashboard/links" className="text-sm font-medium flex items-center text-foreground hover:text-[#44f91f] transition-colors group">
                                            See Details <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* CARD 2: POTENTIAL VALUE */}
                            <Card className="relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-border shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                                {/* Creative Watermark */}
                                <div className="absolute -right-8 -top-8 opacity-[0.03] dark:opacity-[0.05]">
                                    <DollarSign className="h-32 w-32 text-yellow-500 rotate-12" />
                                </div>
                                <div className="absolute left-0 bottom-0 opacity-[0.02] dark:opacity-[0.03]">
                                    <div className="text-[80px] font-bold text-yellow-500 -rotate-12">KSH</div>
                                </div>

                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6 relative z-10">
                                    <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Potential</CardTitle>
                                    <div className="p-2 rounded-lg bg-yellow-500/10">
                                        <DollarSign className="h-4 w-4 text-yellow-500" />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 md:p-6 md:pt-0 relative z-10">
                                    <div className="text-2xl md:text-3xl font-bold text-foreground truncate">KSH {potentialValue >= 1000 ? (potentialValue / 1000).toFixed(0) + 'k' : potentialValue.toLocaleString()}</div>
                                    <p className="text-xs text-muted-foreground mt-1 hidden md:block">
                                        Expected revenue
                                    </p>
                                    <div className="mt-4 pt-4 border-t border-border hidden md:block">
                                        <Link href="/dashboard/links" className="text-sm font-medium flex items-center text-foreground hover:text-yellow-500 transition-colors group">
                                            See Details <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* CARD 3: COMPLETED SALES - Full width on mobile */}
                        <Card className="relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-border shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] md:col-span-1">
                            {/* Creative Watermark */}
                            <div className="absolute -right-8 -top-8 opacity-[0.03] dark:opacity-[0.05]">
                                <Package className="h-32 w-32 text-pink-500 rotate-12" />
                            </div>
                            <div className="absolute left-0 -bottom-4 opacity-[0.02] dark:opacity-[0.03]">
                                <div className="text-[100px] font-bold text-pink-500">{completedLinks.length}</div>
                            </div>

                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6 relative z-10">
                                <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Sales</CardTitle>
                                <div className="p-2 rounded-lg bg-pink-500/10">
                                    <Package className="h-4 w-4 text-pink-500" />
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 md:p-6 md:pt-0 relative z-10">
                                <div className="text-2xl md:text-3xl font-bold text-foreground">{completedLinks.length}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    KES {completedValue.toLocaleString()} earned
                                </p>
                                <div className="mt-4 pt-4 border-t border-border hidden md:block">
                                    <Link href="/dashboard/transactions" className="text-sm font-medium flex items-center text-foreground hover:text-pink-500 transition-colors group">
                                        See Details <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                        {/* LEFT: Active Sales Graph */}
                        <Card className="lg:col-span-2 bg-card border-border shadow-sm">
                            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-3 p-4 md:p-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-sm md:text-base font-semibold text-foreground">Total Revenue</CardTitle>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="text-xs">Your total completed sales revenue</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xl md:text-3xl font-bold text-foreground">KES {completedValue.toLocaleString()}</span>
                                        <span className={cn("text-[10px] md:text-xs font-medium flex items-center", isPositive ? "text-green-500" : "text-red-500")}>
                                            {isPositive ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                                            {percentageChange}%
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="h-7 md:h-8 text-[10px] md:text-xs font-normal hidden sm:flex">
                                        This Year
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="h-[200px] md:h-[300px] w-full pt-0 md:pt-4 px-2 md:px-6 pb-4 md:pb-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#44f91f" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#44f91f" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fill: '#888888' }}
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            dy={10}
                                        />
                                        <YAxis
                                            tick={{ fill: '#888888' }}
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                                        />
                                        <RechartsTooltip
                                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', borderRadius: '8px' }}
                                            itemStyle={{ color: '#44f91f' }}
                                            formatter={(value: number) => [`KES ${value.toLocaleString()}`, "Revenue"]}
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
                            </CardContent>
                        </Card>

                        {/* RIGHT: Sales Performance Radial */}
                        <Card className="bg-card border-border shadow-sm">
                            <CardHeader className="pb-2 p-4 md:p-6">
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-sm md:text-base font-semibold text-foreground">Daily Performance</CardTitle>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="text-xs">Comparison of today's vs yesterday's sales</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center h-[200px] md:h-[300px] relative p-2 md:p-6">
                                <div className="w-full h-full absolute inset-0 flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadialBarChart
                                            innerRadius="70%"
                                            outerRadius="100%"
                                            barSize={15}
                                            data={radialData}
                                            startAngle={180}
                                            endAngle={0}
                                        >
                                            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                                            <RadialBar
                                                background
                                                dataKey="uv"
                                                cornerRadius={30}
                                                fill="#44f91f"
                                            />
                                        </RadialBarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Center Text */}
                                <div className="text-center z-10 mt-6 md:mt-10">
                                    <div className="text-3xl md:text-4xl font-bold text-foreground">{percentageChange}%</div>
                                    <div className="text-xs md:text-sm text-muted-foreground mt-1">vs Yesterday</div>
                                </div>

                                {/* Footer Stats */}
                                <div className="absolute bottom-3 md:bottom-6 w-full px-4 md:px-6 space-y-2 md:space-y-3">
                                    <div className="flex justify-between items-center text-xs md:text-sm">
                                        <span className="text-muted-foreground">Today</span>
                                        <span className="font-medium text-foreground">KES {salesToday.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs md:text-sm">
                                        <span className="text-muted-foreground">Yesterday</span>
                                        <span className="font-medium text-foreground">KES {salesYesterday.toLocaleString()}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}
