import Link from "next/link"
import { useTranslations } from "next-intl"

import { RoutePhotoCredit } from "@/components/decor/page-sheet"
import { RouteBackdrop } from "@/components/decor/route-backdrop"
import { Logo } from "@/components/shell/logo"
import { RoleSwitcher } from "@/components/shell/role-switcher"
import { ThemeToggle } from "@/components/shell/theme-toggle"
import { Card, CardContent } from "@/components/ui/card"

// One centred card over the page's background photo (shadcn login-block pattern): logo above,
// the form in a Card, legal links below. Same shell for every auth page, phone to desktop.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const tf = useTranslations("Footer")
  const tc = useTranslations("Common")
  return (
    <div className="relative isolate flex min-h-svh flex-col">
      <RouteBackdrop />
      <RoleSwitcher />
      {/* Phones: logo and theme toggle share one row so the card starts higher up. */}
      <header className="flex page-container items-center justify-between pt-3 text-white sm:justify-end">
        <Logo className="sm:hidden" />
        <ThemeToggle />
      </header>

      <main
        id="main"
        className="flex page-container flex-1 flex-col items-center justify-center gap-6 pt-4 pb-10 sm:pt-0"
      >
        <div className="hidden flex-col items-center gap-1 text-white sm:flex">
          <Logo className="text-lg" />
          <p className="text-xs text-white/80">{tc("tagline")}</p>
        </div>

        <Card className="w-full max-w-md text-sm shadow-2xl [--card-spacing:--spacing(6)] sm:[--card-spacing:--spacing(8)]">
          <CardContent>{children}</CardContent>
        </Card>

        <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-xs text-white/80">
          <span>{tf("copyright", { year: new Date().getFullYear() })}</span>
          <Link
            href="/legal/privacy"
            className="hover:text-white hover:underline"
          >
            {tf("privacy")}
          </Link>
          <Link
            href="/legal/terms"
            className="hover:text-white hover:underline"
          >
            {tf("terms")}
          </Link>
          <RoutePhotoCredit className="text-xs text-white/80" />
        </footer>
      </main>
    </div>
  )
}
