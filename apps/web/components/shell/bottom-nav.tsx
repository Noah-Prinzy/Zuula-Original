"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  RiBookmarkFill,
  RiBookmarkLine,
  RiBookOpenFill,
  RiBookOpenLine,
  RiHome5Fill,
  RiHome5Line,
  RiSearchEyeFill,
  RiSearchEyeLine,
  RiUser3Fill,
  RiUser3Line,
  RiWifiOffLine,
  type RemixiconComponentType,
} from "@remixicon/react"
import { useTranslations } from "next-intl"

import { useSession } from "@/components/providers/session-provider"
import { useOnline } from "@/components/pwa/use-online"
import { isInSection } from "@/lib/navigation"
import { LOCALES } from "@/lib/locales"
import { cn } from "@/lib/utils"

// proxy.ts rewrites "/" to "/<locale>" internally, so either form can reach us.
const HOME_PATHS = new Set(["/", ...LOCALES.map((l) => `/${l.code}`)])

type Tab = {
  href: string
  label: string
  icon: RemixiconComponentType
  activeIcon: RemixiconComponentType
  active: boolean
}

// Phone tab bar (below md, where the header collapses to a menu): the four places people go
// most, plus their account, a thumb's reach away. "Saved" is the offline reading list, so it
// stays one tap away on a poor connection. The header menu still holds About, search and the
// Review/Admin workspaces. A spacer in the page flow keeps the last content clear of the bar;
// its height is --bottom-nav-h (globals.css), which also clears the home indicator.
// Offline, a strip on top of the bar says so and points to the saved reports.
export function BottomNav() {
  const pathname = usePathname()
  const { user } = useSession()
  const t = useTranslations("Nav")
  const tc = useTranslations("Common")
  const to = useTranslations("Offline")
  const online = useOnline()

  const account = user ? "/account" : "/sign-in"
  const tabs: Tab[] = [
    { href: "/", label: t("items.home"), icon: RiHome5Line, activeIcon: RiHome5Fill, active: HOME_PATHS.has(pathname) },
    {
      href: "/verify",
      label: t("items.verify"),
      icon: RiSearchEyeLine,
      activeIcon: RiSearchEyeFill,
      active: isInSection(pathname, "/verify") || pathname.startsWith("/submissions/"),
    },
    {
      href: "/fact-checks",
      label: t("items.library"),
      icon: RiBookOpenLine,
      activeIcon: RiBookOpenFill,
      active: isInSection(pathname, "/fact-checks"),
    },
    { href: "/offline", label: t("items.saved"), icon: RiBookmarkLine, activeIcon: RiBookmarkFill, active: isInSection(pathname, "/offline") },
    {
      href: account,
      label: user ? t("groups.account") : tc("signIn"),
      icon: RiUser3Line,
      activeIcon: RiUser3Fill,
      active: isInSection(pathname, account),
    },
  ]

  return (
    <>
      <div aria-hidden className={cn("h-(--bottom-nav-h) shrink-0 md:hidden", !online && "h-[calc(var(--bottom-nav-h)+2rem)]")} />
      <nav
        aria-label={t("tabBar")}
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
      >
        {!online && (
          <p role="status" className="flex h-8 items-center justify-between gap-3 border-b bg-muted px-4 text-xs">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <RiWifiOffLine className="size-3.5" aria-hidden />
              {to("banner")}
            </span>
            {!isInSection(pathname, "/offline") && (
              <Link href="/offline" className="font-medium underline underline-offset-4">
                {to("bannerAction")}
              </Link>
            )}
          </p>
        )}
        <ul className="grid h-14 grid-cols-5">
          {tabs.map((tab) => {
            const Icon = tab.active ? tab.activeIcon : tab.icon
            return (
              <li key={tab.label} className="flex">
                <Link
                  href={tab.href}
                  aria-current={tab.active ? "page" : undefined}
                  className={cn(
                    "relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[0.6875rem] text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                    // Same 2px primary marker as the header links and section tabs.
                    "before:absolute before:inset-x-3 before:top-0 before:h-0.5 before:bg-transparent before:transition-colors",
                    tab.active && "font-semibold text-foreground before:bg-primary"
                  )}
                >
                  <Icon className={cn("size-5", tab.active && "text-primary")} aria-hidden />
                  <span className="max-w-full truncate px-1">{tab.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
