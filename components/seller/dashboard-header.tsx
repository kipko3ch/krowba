"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Settings, LayoutDashboard, LinkIcon, Package, Menu, Plus } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import type { Seller } from "@/types"

interface DashboardHeaderProps {
  seller: Seller | null
}

export function DashboardHeader({ seller }: DashboardHeaderProps) {
  const router = useRouter()

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
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="-ml-2">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[300px] p-6">
                <div className="flex flex-col gap-8 mt-4">
                  <Link href="/dashboard" className="text-2xl tracking-tight font-serif text-foreground hover:text-primary transition-colors">
                    KROWBA
                  </Link>
                  <nav className="flex flex-col gap-4">
                    <Link
                      href="/dashboard"
                      className="text-sm flex items-center gap-3 py-2 hover:text-primary transition-colors text-muted-foreground"
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/links"
                      className="text-sm flex items-center gap-3 py-2 hover:text-primary transition-colors text-muted-foreground"
                    >
                      <LinkIcon className="h-5 w-5" />
                      My Links
                    </Link>
                    <Link
                      href="/dashboard/transactions"
                      className="text-sm flex items-center gap-3 py-2 hover:text-primary transition-colors text-muted-foreground"
                    >
                      <Package className="h-5 w-5" />
                      Transactions
                    </Link>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
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
        </div>
      </div>
    </header>
  )
}
