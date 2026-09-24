import Link from "next/link"
import { useTranslations } from "next-intl"

import { RoutePhotoCredit } from "@/components/decor/page-sheet"
import { RouteBackdrop } from "@/components/decor/route-backdrop"
import { Logo } from "@/components/shell/logo"
import { RoleSwitcher } from "@/components/shell/role-switcher"
import { ThemeToggle } from "@/components/shell/theme-toggle"

// Split screen (shadcn login-02 block): the form on the plain page background, the route's
// clip or photo in a panel beside it. On phones the panel becomes a short band above the
// form. Same shell for every auth page.
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
        <div className="flex flex-col gap-6 p-6 md:p-10">
          <header className="flex items-center justify-between">
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
              className="hover:text-foreground hover:underline"
            >
              {tf("privacy")}
            </Link>
            <Link
              href="/legal/terms"
              className="hover:text-foreground hover:underline"
            >
              {tf("terms")}
            </Link>
          </footer>
        </div>

        {/* Decorative: the clip (or photo) for this page, with the tagline and its credit. */}
        <div className="relative isolate order-first h-40 overflow-hidden bg-muted sm:h-56 lg:sticky lg:top-0 lg:order-last lg:h-svh">
          <RouteBackdrop
            className="absolute"
            scrimClassName="bg-linear-to-t from-black/70 via-black/20 to-black/10"
          />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-end gap-4 p-4 text-white sm:justify-between md:p-10">
            <p className="hidden font-heading text-lg font-bold tracking-tight sm:block md:text-2xl">
              {tc("tagline")}
            </p>
            <RoutePhotoCredit className="shrink-0 text-xs text-white/80" />
          </div>
        </div>
      </div>
    </div>
  )
}
