"use client"

import { Fragment, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"

import { useSession } from "@/components/providers/session-provider"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { APP_NAV, isActivePath, isInSection, NON_PAGE_ROUTES, ROUTE_KEYS, type NavGroup } from "@/lib/navigation"
import { hasAnyRole } from "@/lib/roles"
import { cn } from "@/lib/utils"

// Breadcrumb label: a translated nav label where one exists, else the raw segment (e.g. a case ID).
function useTitleFor() {
  const t = useTranslations("Nav")
  return (href: string) => {
    const key = ROUTE_KEYS[href]
    if (key) return t(key)
    const last = href.split("/").pop() ?? ""
    return decodeURIComponent(last)
  }
}

// The current section's nav group, filtered for the signed-in role.
function useSection(): NavGroup | null {
  const pathname = usePathname()
  const { role, ready } = useSession()
  if (!ready || !role) return null

  const group = APP_NAV.find((g) => isInSection(pathname, g.href))
  if (!group || !hasAnyRole(role, group.roles)) return null

  const items = group.items.filter((i) => hasAnyRole(role, i.roles))
  return items.length > 0 ? { ...group, items } : null
}

function SectionSidebar({ section, pathname }: { section: NavGroup; pathname: string }) {
  const t = useTranslations("Nav")
  const label = t(`groups.${section.key}`)
  return (
    <nav aria-label={t("section", { section: label })} className="sticky top-20 flex flex-col gap-2">
      <p className="px-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
        {label}
      </p>
      <ul className="flex flex-col gap-0.5">
        {section.items.map((item) => {
          const Icon = item.icon
          const active = isActivePath(pathname, item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "press-tint flex items-center gap-2.5 border-l-2 border-transparent px-3 py-2 text-sm text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4 [&_svg]:shrink-0",
                  active && "border-primary bg-muted font-medium text-foreground"
                )}
              >
                {Icon && <Icon aria-hidden />}
                <span className="truncate">{t(`items.${item.key}`)}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function SectionTabs({ section, pathname }: { section: NavGroup; pathname: string }) {
  const t = useTranslations("Nav")
  const listRef = useRef<HTMLUListElement>(null)

  // Keep the active tab visible without scrolling the page.
  useEffect(() => {
    const list = listRef.current
    const active = list?.querySelector<HTMLElement>("[aria-current=page]")
    if (!list || !active) return
    list.scrollLeft = active.offsetLeft - (list.clientWidth - active.offsetWidth) / 2
  }, [pathname])

  return (
    <nav aria-label={t("section", { section: t(`groups.${section.key}`) })} className="border-b">
      <ul
        ref={listRef}
        className="-mb-px flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {section.items.map((item) => {
          const Icon = item.icon
          const active = isActivePath(pathname, item.href)
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "press-tint flex items-center gap-2 border-b-2 border-transparent px-3 py-2.5 text-sm whitespace-nowrap text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset [&_svg]:size-4",
                  active && "border-primary font-medium text-foreground"
                )}
              >
                {Icon && <Icon aria-hidden />}
                {t(`items.${item.key}`)}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function SectionBreadcrumbs({ pathname }: { pathname: string }) {
  const titleFor = useTitleFor()
  const parts = pathname.split("/").filter(Boolean)
  const crumbs = parts.map((_, i) => "/" + parts.slice(0, i + 1).join("/"))
  if (crumbs.length < 2) return null

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((href, i) => (
          <Fragment key={href}>
            {i > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {i === crumbs.length - 1 ? (
                <BreadcrumbPage>{titleFor(href)}</BreadcrumbPage>
              ) : NON_PAGE_ROUTES.has(href) ? (
                <span>{titleFor(href)}</span>
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
  )
}

// Page frame for the Review, Admin and Account areas: section nav beside
// (desktop) or above (mobile) the content, under the global site header.
export function SectionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const section = useSection()

  return (
    <div
      className={cn(
        "page-container py-6 md:py-8",
        section && "lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10"
      )}
    >
      {section && (
        // Not an <aside>: the <nav> inside is already the (labelled) landmark.
        <div className="hidden lg:block">
          <SectionSidebar section={section} pathname={pathname} />
        </div>
      )}
      <div className="flex min-w-0 flex-col gap-6">
        {section && (
          <div className="lg:hidden">
            <SectionTabs section={section} pathname={pathname} />
          </div>
        )}
        <SectionBreadcrumbs pathname={pathname} />
        {children}
      </div>
    </div>
  )
}
