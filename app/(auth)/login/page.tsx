"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, CheckCircle2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex w-full bg-white font-sans text-gray-900">
      {/* Left Side - Aurora Background (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-[#f8faf9] items-center justify-center p-12">
        {/* Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}
          />
          <div className="absolute top-0 left-0 w-[800px] h-[800px] rounded-full opacity-40 blur-[100px]"
            style={{
              background: 'radial-gradient(circle, rgba(68, 249, 31, 0.15) 0%, transparent 70%)',
              transform: 'translate(-20%, -20%)'
            }}
          />
          <div className="absolute bottom-0 right-0 w-[800px] h-[800px] rounded-full opacity-40 blur-[100px]"
            style={{
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
              transform: 'translate(20%, 20%)'
            }}
          />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 max-w-lg">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          <h1 className="font-serif-display text-5xl leading-tight mb-6 text-gray-900">
            Welcome back to the <span className="text-primary-dim">trust layer.</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Continue managing your secure links, tracking deliveries, and growing your business with peace of mind.
          </p>

          <div className="space-y-4">
            {[
              "Real-time delivery tracking",
              "Instant payment verification",
              "Automated dispute resolution"
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-gray-700">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary-dim">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <Link href="/" className="lg:hidden font-serif-display text-3xl tracking-wide text-gray-900 mb-8 block">
              krowba
            </Link>
            <h2 className="font-serif-display text-3xl font-bold tracking-tight text-gray-900">Sign in</h2>
            <p className="text-muted-foreground mt-2">Enter your details to access your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-gray-50/50 border-gray-200 focus:border-primary focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="text-sm font-medium text-primary-dim hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-gray-50/50 border-gray-200 focus:border-primary focus:ring-primary/20 transition-all"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-all hover:scale-[1.02]"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="font-medium text-primary-dim hover:underline">
              Create free account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
