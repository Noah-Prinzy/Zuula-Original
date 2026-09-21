"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { RiMenuLine } from "@remixicon/react"

import { useSession } from "@/components/providers/session-provider"
import { GlobalSearch } from "@/components/shell/global-search"
import { LanguageSwitcher } from "@/components/shell/language-switcher"
import { Logo } from "@/components/shell/logo"
import { NotificationBell } from "@/components/shell/notification-bell"
import { ThemeToggle } from "@/components/shell/theme-toggle"
import { UserMenu } from "@/components/shell/user-menu"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { isActivePath, PUBLIC_NAV } from "@/lib/navigation"
import { hasAnyRole } from "@/lib/roles"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  const pathname = usePathname()
  const { user, role } = useSession()

  const nav = [
    ...PUBLIC_NAV,
    ...(hasAnyRole(role, ["expert", "admin"]) ? [{ title: "Dashboard", href: "/dashboard" }] : []),
  ]

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {nav.map((item) => {
            const active = isActivePath(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
                  active && "text-foreground underline decoration-primary decoration-2 underline-offset-[18px]"
                )}
              >
                {item.title}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <div className="hidden md:block">
            <GlobalSearch />
          </div>
          <LanguageSwitcher />
          <ThemeToggle />
          {user && <NotificationBell />}
          <div className="hidden sm:block">
            <UserMenu />
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <RiMenuLine aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle asChild>
                  <div>
                    <Logo />
                  </div>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 px-4">
                <GlobalSearch />
                <nav aria-label="Mobile" className="flex flex-col">
                  {nav.map((item) => (
                    <SheetClose asChild key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
                        className="border-b py-3 text-sm aria-[current=page]:font-semibold aria-[current=page]:text-primary"
                      >
                        {item.title}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
                <div className="sm:hidden">
                  <UserMenu />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
