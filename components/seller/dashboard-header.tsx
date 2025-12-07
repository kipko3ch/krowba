"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Settings, LayoutDashboard, LinkIcon, Package, Menu, Plus, Wallet } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import type { Seller } from "@/types"

interface DashboardHeaderProps {
  seller: Seller | null
}

export function DashboardHeader({ seller }: DashboardHeaderProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-8">
          {/* Mobile Menu */}
          <div className="md:hidden">
            {mounted && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="-ml-2">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Navigation Menu</SheetTitle>
                    <SheetDescription>Access dashboard navigation and settings</SheetDescription>
                  </SheetHeader>
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-6 border-b">
                      <Link href="/dashboard" className="text-2xl tracking-tight font-serif text-foreground">
                        KROWBA
                      </Link>
                      <p className="text-xs text-muted-foreground mt-1">
                        {seller?.business_name || "Dashboard"}
                      </p>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1">
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <LayoutDashboard className="h-5 w-5" />
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard/links"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <LinkIcon className="h-5 w-5" />
                        My Links
                      </Link>
                      <Link
                        href="/dashboard/transactions"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <Package className="h-5 w-5" />
                        Transactions
                      </Link>
                      <Link
                        href="/dashboard/payouts"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <Wallet className="h-5 w-5" />
                        Payouts
                      </Link>
                    </nav>

                    {/* Footer Actions */}
                    <div className="p-4 border-t space-y-2">
                      <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground"
                      >
                        <Settings className="h-5 w-5" />
                        Settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground w-full"
                      >
                        <LogOut className="h-5 w-5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>

          <Link href="/dashboard" className="text-2xl tracking-tight font-serif text-foreground hover:text-primary transition-colors">
            KROWBA
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm flex items-center gap-2 hover:text-primary transition-colors text-muted-foreground"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/dashboard/links"
              className="text-sm flex items-center gap-2 hover:text-primary transition-colors text-muted-foreground"
            >
              <LinkIcon className="h-4 w-4" />
              My Links
            </Link>
            <Link
              href="/dashboard/transactions"
              className="text-sm flex items-center gap-2 hover:text-primary transition-colors text-muted-foreground"
            >
              <Package className="h-4 w-4" />
              Transactions
            </Link>
            <Link
              href="/dashboard/payouts"
              className="text-sm flex items-center gap-2 hover:text-primary transition-colors text-muted-foreground"
            >
              <Wallet className="h-4 w-4" />
              Payouts
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/dashboard/create" className="hidden sm:block">
            <Button size="sm" className="font-medium">Create Link</Button>
          </Link>
          {/* Mobile Create Button (Icon only) */}
          <Link href="/dashboard/create" className="sm:hidden">
            <Button size="icon" className="h-9 w-9">
              <Plus className="h-5 w-5" />
            </Button>
          </Link>

          {/* Theme Toggle */}
          <ThemeToggle />

          {mounted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-primary/20 hover:bg-primary/10 hover:text-primary px-2 sm:px-4">
                  <User className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{seller?.business_name || "Account"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}
