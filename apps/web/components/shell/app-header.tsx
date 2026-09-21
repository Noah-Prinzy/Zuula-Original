"use client"

import { Fragment } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { LanguageSwitcher } from "@/components/shell/language-switcher"
import { NotificationBell } from "@/components/shell/notification-bell"
import { ThemeToggle } from "@/components/shell/theme-toggle"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ROUTE_TITLES } from "@/lib/navigation"

function titleFor(href: string) {
  const last = href.split("/").pop() ?? ""
  return ROUTE_TITLES[href] ?? last.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase())
}

export function AppHeader() {
  const pathname = usePathname()
  const parts = pathname.split("/").filter(Boolean)
  const crumbs = parts.map((_, i) => "/" + parts.slice(0, i + 1).join("/"))

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((href, i) => (
            <Fragment key={href}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {i === crumbs.length - 1 ? (
                  <BreadcrumbPage>{titleFor(href)}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{titleFor(href)}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
        <NotificationBell />
      </div>
    </header>
  )
}
