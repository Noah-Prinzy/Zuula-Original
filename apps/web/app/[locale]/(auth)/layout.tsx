import Link from "next/link"
import { useTranslations } from "next-intl"

import { AuthSectionLabel } from "@/components/auth/auth-section-label"
import { ZuulaMarkOutline } from "@/components/brand/zuula-mark"
import { RoutePhotoCredit } from "@/components/decor/page-sheet"
import { RouteBackdrop } from "@/components/decor/route-backdrop"
import { KineticText } from "@/components/motion/text/kinetic-text"
import { ScrambleText } from "@/components/motion/text/scramble-text"
import { Logo } from "@/components/shell/logo"
import { RoleSwitcher } from "@/components/shell/role-switcher"
import { ThemeToggle } from "@/components/shell/theme-toggle"

const POINTS = ["point1", "point2", "point3", "point4"] as const

// A front page, not a split screen: the route's photo fills the whole page, the brand headline is
// set straight on it like a cover story, and the form sits on a floating newspaper sheet (masthead
// strip, double rule, crimson block offset behind it). Phones stack headline over sheet.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const t = useTranslations("Auth.layout")
  const tf = useTranslations("Footer")
  const tc = useTranslations("Common")
  return (
    <div className="relative isolate flex min-h-svh flex-col overflow-clip">
      <RouteBackdrop />
      <RoleSwitcher />
      <ZuulaMarkOutline className="pointer-events-none absolute -bottom-40 -left-40 -z-10 hidden size-[40rem] text-white opacity-[0.07] lg:block" />

      <header className="flex h-16 page-container items-center justify-between text-white">
        <Logo />
        <ThemeToggle />
      </header>

      <div className="grid page-container flex-1 content-start items-center gap-8 py-6 lg:content-center lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-16 lg:py-12 xl:grid-cols-[minmax(0,1fr)_32rem] xl:gap-24">
        {/* The cover story. Decorative: the form's own h1 is the page heading. */}
        <aside aria-hidden className="flex flex-col gap-5 text-white lg:gap-8">
          <p className="enter flex items-center gap-3 font-heading text-xs font-semibold tracking-widest uppercase opacity-90">
            <span className="h-0.5 w-8 bg-primary" />
            <ScrambleText text={tc("tagline")} />
          </p>
          <h2 className="max-w-2xl font-heading text-3xl leading-[1.05] font-bold tracking-tight text-balance drop-shadow-sm [--kinetic-accent:var(--chart-1)] [--mark:oklch(1_0_0/0.22)] sm:text-4xl lg:text-5xl xl:text-6xl">
            <KineticText
              text={t("headline")}
              delay={150}
              highlight={[t("headlineHighlight")]}
            />
          </h2>
          {/* Four short "columns", each under a rule, like the index on a front page. */}
          <ol className="hidden max-w-2xl grid-cols-2 gap-x-8 gap-y-6 lg:grid">
            {POINTS.map((p, i) => (
              <li
                key={p}
                className="enter flex flex-col gap-2 border-t border-white/30 pt-3 text-base leading-snug"
                style={{ "--d": 5 + i } as React.CSSProperties}
              >
                <span className="font-heading text-xs font-bold tracking-widest text-chart-1">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {t(p)}
              </li>
            ))}
          </ol>
          <p className="enter hidden max-w-xl text-sm text-white/80 [--d:9] lg:block">
            {t("developedBy")}
          </p>
        </aside>

        <main id="main" className="relative w-full self-center">
          {/* Crimson block offset behind the sheet: lifts it off any photo, in both themes. */}
          <div
            aria-hidden
            className="absolute inset-0 translate-x-2 translate-y-2 bg-primary sm:translate-x-3 sm:translate-y-3"
          />
          <div className="relative bg-background shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-6 pt-4 font-heading text-[0.6875rem] font-bold tracking-widest uppercase sm:px-8">
              <AuthSectionLabel className="text-primary dark:text-chart-1" />
              <span className="text-muted-foreground">{tc("tagline")}</span>
            </div>
            <div
              aria-hidden
              className="mx-6 mt-3 h-1.5 border-y border-foreground sm:mx-8"
            />
            <div className="px-6 pt-6 pb-8 sm:px-8 sm:pt-8 sm:pb-10">
              {children}
            </div>
          </div>
        </main>
      </div>

      <footer className="flex page-container flex-wrap items-center justify-between gap-x-4 gap-y-2 py-6 text-xs text-white/80">
        <span>{tf("copyright", { year: new Date().getFullYear() })}</span>
        <span className="flex flex-wrap items-center gap-4">
          <Link href="/legal/privacy" className="hover:text-white hover:underline">
            {tf("privacy")}
          </Link>
          <Link href="/legal/terms" className="hover:text-white hover:underline">
            {tf("terms")}
          </Link>
          <RoutePhotoCredit className="text-xs text-white/80" />
        </span>
      </footer>
    </div>
  )
}
