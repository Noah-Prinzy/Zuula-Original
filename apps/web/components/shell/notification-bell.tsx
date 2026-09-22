"use client"

import Link from "next/link"
import { RiNotification3Line } from "@remixicon/react"
import { useTranslations } from "next-intl"

import { NotificationIcon } from "@/components/account/notification-icon"
import { markAllRead, markRead, useNotifications } from "@/components/account/notifications-store"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRelativeTime } from "@/hooks/use-relative-time"
import { cn } from "@/lib/utils"

const LATEST = 5

export function NotificationBell() {
  const { items, unread } = useNotifications()
  const t = useTranslations("Notifications")
  const relativeTime = useRelativeTime()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread ? t("labelUnread", { count: unread }) : t("label")}
        >
          <RiNotification3Line aria-hidden />
          {unread > 0 && (
            <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center bg-primary px-1 font-mono text-[10px] leading-4 text-primary-foreground">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] max-w-[calc(100vw-2rem)] p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="font-heading text-sm font-semibold">{t("title")}</p>
          {unread > 0 && (
            <Button variant="link" size="xs" className="px-0" onClick={markAllRead}>
              {t("markAllRead")}
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          <ul>
            {items.slice(0, LATEST).map((n) => (
              <li key={n.id} className="relative border-b last:border-b-0 hover:bg-muted/50">
                <Link
                  href={n.href ?? "/account/notifications"}
                  onClick={() => markRead(n.id)}
                  className="flex gap-3 p-3 after:absolute after:inset-0"
                >
                  <NotificationIcon kind={n.kind} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className={cn("text-sm", !n.read && "font-semibold")}>{n.title}</span>
                    <span className="line-clamp-2 text-xs text-muted-foreground">{n.body}</span>
                    <span className="text-[11px] text-muted-foreground">{relativeTime(n.createdAt)}</span>
                  </span>
                  {!n.read && <span className="mt-1.5 size-2 shrink-0 bg-primary" aria-label={t("unread")} />}
                </Link>
              </li>
            ))}
          </ul>
        </ScrollArea>
        <div className="border-t p-2">
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link href="/account/notifications">{t("viewAll")}</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
