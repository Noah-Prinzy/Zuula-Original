"use client"

import Link from "next/link"
import {
  RiDashboardLine,
  RiLogoutBoxRLine,
  RiNotification3Line,
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
import { hasAnyRole, ROLE_LABELS } from "@/lib/roles"

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function UserMenu() {
  const { user, role, signOut } = useSession()

  if (!user) {
    return (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/login">Log in</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/register">Register</Link>
        </Button>
      </div>
    )
  }

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
        <DropdownMenuGroup>
          {hasAnyRole(role, ["expert", "admin"]) && (
            <DropdownMenuItem asChild>
              <Link href="/dashboard">
                <RiDashboardLine aria-hidden /> Dashboard
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href="/account">
              <RiUserSettingsLine aria-hidden /> Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/account/alerts">
              <RiNotification3Line aria-hidden /> Alerts
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut}>
          <RiLogoutBoxRLine aria-hidden /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
