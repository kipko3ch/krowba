"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { CheckCircle2 } from "lucide-react"

export default function SignupPage() {
  const [businessName, setBusinessName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            business_name: businessName,
            phone: phone,
          },
        },
      })
      if (error) throw error
      router.push("/signup/success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex w-full bg-background font-sans">
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
          <Link href="/" className="font-serif-display text-3xl tracking-wide text-gray-900 hover:text-primary transition-colors duration-300 mb-12 block">
            krowba
          </Link>

          <h1 className="font-serif-display text-5xl leading-tight mb-6 text-gray-900">
            Join the <span className="text-primary-dim">trust network.</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Start selling with confidence. Protect your business from ghost buyers and build trust with every transaction.
          </p>

          <div className="space-y-4">
            {[
              "Escrow Protection",
              "Instant Verification",
              "Secure Payments"
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
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-y-auto">
        <div className="w-full max-w-md space-y-8 py-8">
          <div className="text-center lg:text-left">
            <Link href="/" className="lg:hidden font-serif-display text-3xl tracking-wide text-gray-900 mb-8 block">
              krowba
            </Link>
            <h2 className="font-serif-display text-3xl font-bold tracking-tight text-gray-900">Create Account</h2>
            <p className="text-muted-foreground mt-2">Start your journey with Krowba today</p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="business-name">Business Name</Label>
              <Input
                id="business-name"
                type="text"
                placeholder="My Shop"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="h-12 bg-gray-50/50 border-gray-200 focus:border-primary focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="254712345678"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-12 bg-gray-50/50 border-gray-200 focus:border-primary focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seller@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-gray-50/50 border-gray-200 focus:border-primary focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-gray-50/50 border-gray-200 focus:border-primary focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repeat-password">Confirm Password</Label>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  className="h-12 bg-gray-50/50 border-gray-200 focus:border-primary focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-all hover:scale-[1.02] mt-2"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary-dim hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
