import Link from "next/link"
import { RiCheckLine } from "@remixicon/react"
import { useTranslations } from "next-intl"

import { ZuulaMarkOutline } from "@/components/brand/zuula-mark"
import { RoutePhotoCredit } from "@/components/decor/page-sheet"
import { RouteBackdrop } from "@/components/decor/route-backdrop"
import { KineticText } from "@/components/motion/text/kinetic-text"
import { ScrambleText } from "@/components/motion/text/scramble-text"
import { Logo } from "@/components/shell/logo"
import { RoleSwitcher } from "@/components/shell/role-switcher"
import { ThemeToggle } from "@/components/shell/theme-toggle"

const POINTS = ["point1", "point2", "point3", "point4"] as const

// Split screen over the page's background photo: the form on a solid panel (left), the brand
// copy straight on the photo (right, large screens). Phones get a short photo strip instead.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const t = useTranslations("Auth.layout")
  const tf = useTranslations("Footer")
  const tc = useTranslations("Common")
  return (
    <div className="relative isolate flex min-h-svh flex-col">
      <RouteBackdrop />
      <RoleSwitcher />
      <div className="grid flex-1 lg:grid-cols-2">
        <div className="flex flex-col lg:bg-background lg:shadow-2xl">
          <header className="flex h-16 page-container items-center justify-between bg-background">
            <Logo />
            <ThemeToggle />
          </header>
          {/* Small screens don't get the brand panel: the photo shows through this strip. */}
          <div
            aria-hidden
            className="relative flex h-32 items-center sm:h-40 lg:hidden"
          >
            <p className="page-container max-w-sm font-heading text-xl leading-tight font-bold text-balance text-white sm:text-2xl">
              {t("headline")}
            </p>
            <RoutePhotoCredit
              tabIndex={-1}
              className="absolute right-3 bottom-2"
            />
          </div>
          <div className="flex flex-1 flex-col bg-background">
            <main
              id="main"
              className="flex page-container flex-1 items-center justify-center py-10"
            >
              <div className="w-full max-w-md">{children}</div>
            </main>
            <footer className="flex page-container flex-wrap justify-between gap-2 py-6 text-xs text-muted-foreground">
              <span>{tf("copyright", { year: new Date().getFullYear() })}</span>
              <span className="flex gap-4">
                <Link href="/legal/privacy" className="hover:text-foreground">
                  {tf("privacy")}
                </Link>
                <Link href="/legal/terms" className="hover:text-foreground">
                  {tf("terms")}
                </Link>
              </span>
            </footer>
          </div>
        </div>

        <aside
          aria-hidden
          className="relative isolate hidden overflow-hidden text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16"
        >
          <div className="absolute inset-0 -z-10 bg-linear-to-t from-primary/70 via-primary/25 to-transparent" />
          <ZuulaMarkOutline className="pointer-events-none absolute -right-24 -bottom-24 size-[36rem] opacity-10" />
          <p className="enter font-heading text-sm font-semibold tracking-widest uppercase opacity-80">
            <ScrambleText text={tc("tagline")} />
          </p>
          <div className="relative flex max-w-lg flex-col gap-8">
            <h2 className="font-heading text-4xl leading-tight font-bold text-balance [--kinetic-accent:var(--chart-1)] [--mark:oklch(1_0_0/0.22)] xl:text-5xl">
              <KineticText
                text={t("headline")}
                delay={150}
                highlight={[t("headlineHighlight")]}
              />
            </h2>
            <ul className="flex flex-col gap-3 text-base">
              {POINTS.map((p, i) => (
                <li
                  key={p}
                  className="enter flex gap-3"
                  style={{ "--d": 5 + i } as React.CSSProperties}
                >
                  <RiCheckLine className="mt-0.5 size-5 shrink-0" />
                  {t(p)}
                </li>
              ))}
            </ul>
          </div>
          <p className="enter relative text-sm opacity-80 [--d:9]">
            {t("developedBy")}
          </p>
          <RoutePhotoCredit tabIndex={-1} className="absolute top-4 right-4" />
        </aside>
      </div>
    </div>
  )
}
