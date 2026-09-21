"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { RiArrowLeftLine, RiLogoutBoxRLine } from "@remixicon/react"

import { useSession } from "@/components/providers/session-provider"
import { Logo } from "@/components/shell/logo"
import { initials } from "@/components/shell/user-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { APP_NAV, isActivePath } from "@/lib/navigation"
import { hasAnyRole, ROLE_LABELS } from "@/lib/roles"

export function AppSidebar() {
  const pathname = usePathname()
  const { user, role, signOut } = useSession()

  const groups = APP_NAV.filter((g) => hasAnyRole(role, g.roles))
    .map((g) => ({ ...g, items: g.items.filter((i) => hasAnyRole(role, i.roles)) }))
    .filter((g) => g.items.length > 0)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex h-8 items-center px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <Logo className="group-data-[collapsible=icon]:[&>span:last-child]:hidden" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActivePath(pathname, item.href)}
                        tooltip={item.title}
                      >
                        <Link href={item.href}>
                          {Icon && <Icon aria-hidden />}
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Back to site">
              <Link href="/">
                <RiArrowLeftLine aria-hidden />
                <span>Back to site</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {user && (
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" onClick={signOut} tooltip="Log out">
                <Avatar className="size-8">
                  <AvatarFallback>{initials(user.name)}</AvatarFallback>
                </Avatar>
                <span className="flex min-w-0 flex-1 flex-col text-left leading-tight">
                  <span className="truncate text-sm font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {ROLE_LABELS[user.role]}
                  </span>
                </span>
                <RiLogoutBoxRLine className="ml-auto" aria-label="Log out" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
