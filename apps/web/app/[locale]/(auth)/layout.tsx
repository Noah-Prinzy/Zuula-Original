import Link from "next/link"
import { useTranslations } from "next-intl"

import { RoutePhotoCredit } from "@/components/decor/page-sheet"
import { RouteBackdrop } from "@/components/decor/route-backdrop"
import { Logo } from "@/components/shell/logo"
import { RoleSwitcher } from "@/components/shell/role-switcher"
import { ThemeToggle } from "@/components/shell/theme-toggle"

import { AuthAppBar } from "./auth-app-bar"

// Split screen (shadcn login-02 block): the form on the plain page background, the route's
// clip or photo in a panel beside it. Same shell for every auth page.
// Phones: the panel is a short band at the top with an app bar over it (back, logo, theme),
// and the form rises over its lower edge as a sheet, like a native sign-in screen.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const tf = useTranslations("Footer")
  const tc = useTranslations("Common")
  return (
    <div className="flex min-h-svh flex-col">
      <RoleSwitcher />
      <div className="grid flex-1 grid-rows-[auto_1fr] lg:grid-cols-2 lg:grid-rows-1">
        <div className="flex flex-col gap-6 p-6 max-md:relative max-md:z-10 max-md:-mt-4 max-md:border-t max-md:bg-background max-md:px-4 max-md:pt-6 max-md:pb-[max(1.5rem,env(safe-area-inset-bottom))] max-md:shadow-[0_-20px_40px_-28px_rgba(0,0,0,0.45)] md:p-10">
          <header className="flex items-center justify-between max-md:hidden">
            <Logo />
            <ThemeToggle />
          </header>

          <main id="main" className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-sm text-sm">{children}</div>
          </main>

          <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-xs text-muted-foreground lg:justify-start">
            <span>{tf("copyright", { year: new Date().getFullYear() })}</span>
            <Link
              href="/legal/privacy"
              className="hover:text-foreground hover:underline max-md:inline-flex max-md:min-h-11 max-md:items-center"
            >
              {tf("privacy")}
            </Link>
            <Link
              href="/legal/terms"
              className="hover:text-foreground hover:underline max-md:inline-flex max-md:min-h-11 max-md:items-center"
            >
              {tf("terms")}
            </Link>
          </footer>
        </div>

        {/* Decorative: the clip (or photo) for this page, with the tagline and its credit. An
            aside, so the credit link (and the phone app bar) sit inside a landmark. */}
        <aside aria-label={tc("tagline")} className="relative isolate order-first h-40 overflow-hidden bg-muted max-md:h-52 sm:h-56 lg:sticky lg:top-0 lg:order-last lg:h-svh">
          <RouteBackdrop
            className="absolute"
            scrimClassName="bg-linear-to-t from-black/70 via-black/20 to-black/10 max-md:bg-linear-to-b max-md:from-black/55 max-md:via-black/10 max-md:to-black/60"
          />
          <AuthAppBar />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-end gap-4 p-4 text-white max-md:pb-8 sm:justify-between md:p-10">
            <p className="hidden font-heading text-lg font-bold tracking-tight sm:block md:text-2xl">
              {tc("tagline")}
            </p>
            <RoutePhotoCredit className="shrink-0 text-xs text-white/80" />
          </div>
        </aside>
      </div>
    </div>
  )
}
