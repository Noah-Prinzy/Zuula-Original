import {
  RiAwardLine,
  RiDashboardLine,
  RiFileList3Line,
  RiFileSearchLine,
  RiGroupLine,
  RiHistoryLine,
  RiKey2Line,
  RiMegaphoneLine,
  RiNotification3Line,
  RiNotificationBadgeLine,
  RiPieChartLine,
  RiSettings3Line,
  RiShieldCheckLine,
  RiShieldUserLine,
  RiSlideshowLine,
  RiTimeLine,
  RiUserSettingsLine,
  type RemixiconComponentType,
} from "@remixicon/react"

import type { Role } from "@/lib/roles"

export type NavItem = {
  title: string
  href: string
  icon?: RemixiconComponentType
  roles?: readonly Role[]
}

export type NavGroup = {
  label: string
  href: string
  items: NavItem[]
  roles?: readonly Role[]
}

export const REVIEWERS = ["expert", "admin"] as const
export const ADMINS = ["admin"] as const

export const PUBLIC_NAV: NavItem[] = [
  { title: "Verify", href: "/verify" },
  { title: "Library", href: "/fact-checks" },
  { title: "About", href: "/about" },
  { title: "Review", href: "/review", roles: REVIEWERS },
  { title: "Admin", href: "/admin", roles: ADMINS },
]

export const APP_NAV: NavGroup[] = [
  {
    label: "Review",
    href: "/review",
    roles: REVIEWERS,
    items: [
      { title: "Overview", href: "/review", icon: RiDashboardLine },
      { title: "Queue", href: "/review/queue", icon: RiShieldCheckLine },
      { title: "History", href: "/review/history", icon: RiHistoryLine },
    ],
  },
  {
    label: "Admin",
    href: "/admin",
    roles: ADMINS,
    items: [
      { title: "Overview", href: "/admin", icon: RiPieChartLine },
      { title: "Users", href: "/admin/users", icon: RiGroupLine },
      { title: "Moderation", href: "/admin/moderation", icon: RiFileSearchLine },
      { title: "Sources", href: "/admin/sources", icon: RiFileList3Line },
      { title: "Broadcasts", href: "/admin/broadcasts", icon: RiMegaphoneLine },
      { title: "Reports", href: "/admin/reports", icon: RiSlideshowLine },
      { title: "Audit Log", href: "/admin/audit-log", icon: RiShieldUserLine },
      { title: "Settings", href: "/admin/configuration", icon: RiSettings3Line },
    ],
  },
  {
    label: "Account",
    href: "/account",
    items: [
      { title: "Profile", href: "/account", icon: RiUserSettingsLine },
      { title: "Activity", href: "/account/activity", icon: RiTimeLine },
      { title: "Notifications", href: "/account/notifications", icon: RiNotificationBadgeLine },
      { title: "Alerts", href: "/account/alerts", icon: RiNotification3Line },
      {
        title: "Accreditation",
        href: "/account/verification",
        icon: RiAwardLine,
        roles: ["public", "journalist"],
      },
      {
        title: "API Keys",
        href: "/account/api-access",
        icon: RiKey2Line,
        roles: ["journalist", "admin"],
      },
    ],
  },
]

const SECTION_ROOTS = APP_NAV.map((g) => g.href)

// Breadcrumb labels. Section roots show the section name, not the page name.
export const ROUTE_TITLES: Record<string, string> = Object.fromEntries([
  ...APP_NAV.flatMap((g) => g.items.map((i) => [i.href, i.title])),
  ...APP_NAV.map((g) => [g.href, g.label]),
  ["/review/cases", "Cases"],
])

// Path segments that exist only as URL structure, with no page of their own.
export const NON_PAGE_ROUTES = new Set(["/review/cases"])

// Pages without a nav item of their own highlight their parent's item instead.
const ACTIVE_ALIASES: [prefix: string, href: string][] = [["/review/cases", "/review/queue"]]

export function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  const alias = ACTIVE_ALIASES.find(([prefix]) => pathname.startsWith(prefix))
  if (alias) return alias[1] === href
  // Section roots only match exactly inside the section nav.
  if (SECTION_ROOTS.includes(href)) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

// Header links highlight for anything under their section.
export function isInSection(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}
