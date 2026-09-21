"use client"

import Link from "next/link"
import { RiNotification3Line } from "@remixicon/react"

import { Button } from "@/components/ui/button"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

// Placeholder data until the notifications API exists (FR-NOTIFY).
const NOTIFICATIONS = [
  {
    id: "n1",
    title: "Your submission was verified",
    body: "“Free internet for all citizens from January 2027” — Likely False",
    time: "5 min ago",
    unread: true,
  },
  {
    id: "n2",
    title: "Viral misinformation alert: Health",
    body: "A false cure claim is spreading on WhatsApp.",
    time: "1 h ago",
    unread: true,
  },
  {
    id: "n3",
    title: "A verdict you rated was reviewed",
    body: "An expert confirmed the original verdict.",
    time: "Yesterday",
    unread: false,
  },
]

export function NotificationBell() {
  const unread = NOTIFICATIONS.filter((n) => n.unread).length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <RiNotification3Line aria-hidden />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 size-2 bg-primary" aria-hidden />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="font-heading text-sm font-semibold">Notifications</p>
          <Button variant="link" size="xs" className="px-0">
            Mark all read
          </Button>
        </div>
        <ScrollArea className="max-h-80">
          <ItemGroup>
            {NOTIFICATIONS.map((n) => (
              <Item key={n.id} size="sm" className="border-b last:border-b-0">
                <ItemContent>
                  <ItemTitle className="gap-2">
                    {n.unread && <span className="size-1.5 shrink-0 bg-primary" aria-label="Unread" />}
                    {n.title}
                  </ItemTitle>
                  <ItemDescription>{n.body}</ItemDescription>
                  <span className="text-xs text-muted-foreground">{n.time}</span>
                </ItemContent>
              </Item>
            ))}
          </ItemGroup>
        </ScrollArea>
        <div className="border-t p-2">
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link href="/account/alerts">Manage alerts</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
