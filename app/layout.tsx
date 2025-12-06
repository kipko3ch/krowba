import type React from "react"
import type { Metadata, Viewport } from "next"

import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

import { Geist_Mono, Roboto, Hedvig_Letters_Serif, Hedvig_Letters_Sans } from 'next/font/google'

// Initialize fonts
const roboto = Roboto({
  subsets: ['latin'],
  weight: ["300", "400", "500", "700"],
  variable: '--font-roboto',
})

const hedvigLettersSerif = Hedvig_Letters_Serif({
  subsets: ['latin'],
  variable: '--font-hedvig',
})

const hedvigLettersSans = Hedvig_Letters_Sans({
  subsets: ['latin'],
  weight: "400",
  variable: '--font-hedvig-sans',
})

const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Krowba - Trust Layer for African Social Commerce",
  description: "Secure escrow payments for social commerce. Protect buyers and sellers with Krowba.",
  keywords: ["escrow", "social commerce", "Africa", "payments", "M-Pesa", "secure transactions"],
  generator: 'v0.app'
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
}

import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${roboto.variable} ${hedvigLettersSerif.variable} ${hedvigLettersSans.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            richColors
            theme="system"
            toastOptions={{
              className: 'font-sans',
              style: {
                borderRadius: '12px',
              }
            }}
          />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
