"use client"

import Link from "next/link"
import {
  RiDashboardLine,
  RiLogoutBoxRLine,
  RiNotificationBadgeLine,
  RiPieChartLine,
  RiTimeLine,
  RiUserSettingsLine,
} from "@remixicon/react"

import { useSession } from "@/components/providers/session-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ADMINS, REVIEWERS } from "@/lib/navigation"
import { hasAnyRole, ROLE_LABELS } from "@/lib/roles"
import { initials } from "@/lib/utils"

export function UserMenu() {
  const { user, role, signOut } = useSession()

  if (!user) {
    return (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/sign-in">Sign In</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/sign-up">Sign Up</Link>
        </Button>
      </div>
    )
  }

  const workspace = [
    { title: "Review", href: "/review", icon: RiDashboardLine, show: hasAnyRole(role, REVIEWERS) },
    { title: "Admin", href: "/admin", icon: RiPieChartLine, show: hasAnyRole(role, ADMINS) },
  ].filter((i) => i.show)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Account menu">
          <Avatar className="size-7">
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="text-foreground">{user.name}</span>
          <span className="font-normal text-muted-foreground">{ROLE_LABELS[user.role]}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspace.length > 0 && (
          <>
            <DropdownMenuGroup>
              {workspace.map((i) => (
                <DropdownMenuItem key={i.href} asChild>
                  <Link href={i.href}>
                    <i.icon aria-hidden /> {i.title}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/account/activity">
              <RiTimeLine aria-hidden /> Activity
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/account/notifications">
              <RiNotificationBadgeLine aria-hidden /> Notifications
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/account">
              <RiUserSettingsLine aria-hidden /> Profile
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut}>
          <RiLogoutBoxRLine aria-hidden /> Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
