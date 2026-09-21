import {
  RiDashboardLine,
  RiFileList3Line,
  RiFileSearchLine,
  RiGroupLine,
  RiHistoryLine,
  RiKey2Line,
  RiMegaphoneLine,
  RiNotification3Line,
  RiPieChartLine,
  RiSettings3Line,
  RiShieldCheckLine,
  RiShieldUserLine,
  RiSlideshowLine,
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
  items: NavItem[]
  roles?: readonly Role[]
}

export const PUBLIC_NAV: NavItem[] = [
  { title: "Check", href: "/" },
  { title: "Fact-checks", href: "/search" },
  { title: "About", href: "/about" },
]

const REVIEWERS = ["expert", "admin"] as const
const ADMINS = ["admin"] as const

export const APP_NAV: NavGroup[] = [
  {
    label: "Review",
    roles: REVIEWERS,
    items: [
      { title: "Overview", href: "/dashboard", icon: RiDashboardLine },
      { title: "Review queue", href: "/dashboard/queue", icon: RiShieldCheckLine },
      { title: "My reviews", href: "/dashboard/history", icon: RiHistoryLine },
    ],
  },
  {
    label: "Administration",
    roles: ADMINS,
    items: [
      { title: "Metrics", href: "/admin", icon: RiPieChartLine },
      { title: "Users", href: "/admin/users", icon: RiGroupLine },
      { title: "Moderation", href: "/admin/moderation", icon: RiFileSearchLine },
      { title: "Trusted sources", href: "/admin/sources", icon: RiFileList3Line },
      { title: "Broadcasts", href: "/admin/broadcasts", icon: RiMegaphoneLine },
      { title: "Reports", href: "/admin/reports", icon: RiSlideshowLine },
      { title: "Audit log", href: "/admin/audit", icon: RiShieldUserLine },
      { title: "Settings", href: "/admin/settings", icon: RiSettings3Line },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Profile", href: "/account", icon: RiUserSettingsLine },
      { title: "Alerts", href: "/account/alerts", icon: RiNotification3Line },
      {
        title: "API keys",
        href: "/account/api-keys",
        icon: RiKey2Line,
        roles: ["journalist", "admin"],
      },
    ],
  },
]

// Flat lookup used for breadcrumbs.
export const ROUTE_TITLES: Record<string, string> = Object.fromEntries([
  ...PUBLIC_NAV.map((i) => [i.href, i.title]),
  ...APP_NAV.flatMap((g) => g.items.map((i) => [i.href, i.title])),
  ["/dashboard", "Dashboard"],
  ["/admin", "Admin"],
  ["/account", "Account"],
])

export function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  // Section roots (/dashboard, /admin, /account) only match exactly.
  if (["/dashboard", "/admin", "/account"].includes(href)) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}
