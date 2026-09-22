"use client"

import * as React from "react"
import Link from "next/link"
import { RiNotification3Line, RiNotificationOffLine } from "@remixicon/react"
import { useTranslations } from "next-intl"

import { NotificationIcon } from "@/components/account/notification-icon"
import { markAllRead, markRead, useNotifications } from "@/components/account/notifications-store"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useRelativeTime } from "@/hooks/use-relative-time"
import { cn } from "@/lib/utils"

const LATEST = 5

export function NotificationBell() {
  const { items, unread } = useNotifications()
  const [open, setOpen] = React.useState(false)
  const t = useTranslations("Notifications")
  const ta = useTranslations("Account.notifications")
  const relativeTime = useRelativeTime()
  const latest = items.slice(0, LATEST)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread ? t("labelUnread", { count: unread }) : t("label")}
        >
          <RiNotification3Line aria-hidden />
          {/* Small count pinned to the bell's top-right corner; the ring keeps it apart from the icon. */}
          {unread > 0 && (
            <span
              aria-hidden
              className="pointer-events-none absolute top-1 right-0 flex h-3.5 min-w-3.5 items-center justify-center bg-primary px-0.5 font-mono text-[9px] leading-none font-semibold text-primary-foreground tabular-nums ring-2 ring-background"
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      {/* Height follows the space Radix measures below the trigger, so the panel never runs off-screen;
          only the list scrolls, the header and footer stay put. */}
      <PopoverContent
        align="end"
        sideOffset={8}
        collisionPadding={8}
        className="flex max-h-[min(32rem,var(--radix-popover-content-available-height))] w-[min(22rem,calc(100vw-1rem))] flex-col gap-0 overflow-hidden p-0"
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
          <p className="font-heading text-sm font-semibold">{t("title")}</p>
          {unread > 0 && (
            <Button variant="link" size="xs" className="h-auto px-0 dark:text-foreground" onClick={markAllRead}>
              {t("markAllRead")}
            </Button>
          )}
        </div>

        {latest.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
            <RiNotificationOffLine className="size-6 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium">{ta("emptyAll")}</p>
            <p className="text-xs text-muted-foreground">{ta("emptyBody")}</p>
          </div>
        ) : (
          <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {latest.map((n) => (
              <li key={n.id} className="relative border-b last:border-b-0 hover:bg-muted/50">
                <Link
                  href={n.href ?? "/account/notifications"}
                  onClick={() => {
                    markRead(n.id)
                    setOpen(false)
                  }}
                  className="flex gap-3 px-3 py-2.5 outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
                >
                  <NotificationIcon kind={n.kind} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className={cn("text-sm leading-snug", !n.read && "font-semibold")}>{n.title}</span>
                    <span className="line-clamp-2 text-xs text-muted-foreground">{n.body}</span>
                    <span className="text-[11px] text-muted-foreground">{relativeTime(n.createdAt)}</span>
                  </span>
                  {!n.read && (
                    <span className="mt-1.5 size-2 shrink-0 bg-primary">
                      <span className="sr-only">{t("unread")}</span>
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="shrink-0 border-t p-1.5">
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link href="/account/notifications" onClick={() => setOpen(false)}>
              {t("viewAll")}
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
