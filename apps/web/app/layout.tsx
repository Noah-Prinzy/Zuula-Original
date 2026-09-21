import { Suspense } from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Lora, Raleway } from "next/font/google"

import "./globals.css"
import { MOTION_INIT_SCRIPT } from "@/components/motion/motion-init"
import { RevealObserver } from "@/components/motion/reveal-observer"
import { SessionProvider } from "@/components/providers/session-provider"
import { RouteProgress } from "@/components/shell/route-progress"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

// latin-ext is required for ŋ (Luganda, Acholi).
const ralewayHeading = Raleway({
  subsets: ["latin", "latin-ext"],
  variable: "--font-heading",
})

const lora = Lora({
  subsets: ["latin", "latin-ext"],
  variable: "--font-serif",
})

const fontSans = Geist({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Zuula — Uganda Fact-Guard",
  description:
    "AI-powered fake news and misinformation detection for Uganda. Developed by Victoria University CIT.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontSans.variable,
        fontMono.variable,
        "font-serif",
        lora.variable,
        ralewayHeading.variable
      )}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: MOTION_INIT_SCRIPT }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only z-50 bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Skip to content
        </a>
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        <RevealObserver />
        <ThemeProvider>
          <SessionProvider>
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
