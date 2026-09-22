"use client"

import * as React from "react"
import Link from "next/link"
import { RiCheckDoubleLine, RiMore2Line, RiNotificationOffLine } from "@remixicon/react"
import { useTranslations } from "next-intl"

import { NotificationIcon, useNotificationLabel } from "@/components/account/notification-icon"
import {
  markAllRead,
  markRead,
  markUnread,
  removeNotification,
  useNotifications,
} from "@/components/account/notifications-store"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useRelativeTime } from "@/hooks/use-relative-time"
import { cn } from "@/lib/utils"

type Filter = "all" | "unread"

export function NotificationsList() {
  const { items, unread } = useNotifications()
  const [filter, setFilter] = React.useState<Filter>("all")
  const t = useTranslations("Account.notifications")
  const tn = useTranslations("Notifications")
  const tc = useTranslations("Common")
  const notificationLabel = useNotificationLabel()
  const relativeTime = useRelativeTime()
  const shown = filter === "unread" ? items.filter((n) => !n.read) : items

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={filter}
          onValueChange={(v) => v && setFilter(v as Filter)}
          aria-label={t("filterLabel")}
        >
          <ToggleGroupItem value="all">{t("all", { count: items.length })}</ToggleGroupItem>
          <ToggleGroupItem value="unread">{t("unread", { count: unread })}</ToggleGroupItem>
        </ToggleGroup>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={unread === 0}>
            <RiCheckDoubleLine aria-hidden /> {tn("markAllRead")}
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/account/alerts">{t("alertSettings")}</Link>
          </Button>
        </div>
      </div>

      {shown.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiNotificationOffLine aria-hidden />
            </EmptyMedia>
            <EmptyTitle>{filter === "unread" ? t("emptyUnread") : t("emptyAll")}</EmptyTitle>
            <EmptyDescription>{t("emptyBody")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="flex flex-col divide-y border bg-card">
          {shown.map((n) => (
            <li key={n.id} className={cn("relative flex gap-3 p-4", !n.read && "bg-primary/[0.03]")}>
              <NotificationIcon kind={n.kind} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="text-xs text-muted-foreground">
                  {notificationLabel(n.kind)} · <time dateTime={n.createdAt}>{relativeTime(n.createdAt)}</time>
                </p>
                {n.href ? (
                  <Link
                    href={n.href}
                    onClick={() => markRead(n.id)}
                    className={cn("text-sm after:absolute after:inset-0 hover:text-primary", !n.read && "font-semibold")}
                  >
                    {n.title}
                  </Link>
                ) : (
                  <p className={cn("text-sm", !n.read && "font-semibold")}>{n.title}</p>
                )}
                <p className="text-sm text-muted-foreground">{n.body}</p>
              </div>
              <div className="relative z-10 flex items-start gap-2">
                {!n.read && <span className="mt-2 size-2 bg-primary" aria-label={t("unreadDot")} />}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label={t("options", { title: n.title })}>
                      <RiMore2Line aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {n.read ? (
                      <DropdownMenuItem onSelect={() => markUnread(n.id)}>{t("markUnread")}</DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onSelect={() => markRead(n.id)}>{t("markRead")}</DropdownMenuItem>
                    )}
                    <DropdownMenuItem onSelect={() => removeNotification(n.id)}>{tc("remove")}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
