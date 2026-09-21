"use client"

import * as React from "react"
import Link from "next/link"
import { RiFlagLine, RiRobot2Line, RiThumbDownLine, RiThumbUpLine } from "@remixicon/react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CONTENT_REPORTS, MANIPULATION_SIGNALS } from "@/lib/mock/admin"
import { relativeTime } from "@/lib/mock/account"

function Done({ title }: { title: string }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>New items appear here as they come in.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

function Reports() {
  const [items, setItems] = React.useState(CONTENT_REPORTS)
  const resolve = (id: string, message: string) => {
    setItems((xs) => xs.filter((x) => x.id !== id))
    toast.success(message, { description: "Logged in the audit trail." })
  }

  if (items.length === 0) return <Done title="No open reports" />
  return (
    <ul className="flex flex-col divide-y border bg-card">
      {items.map((r) => (
        <li key={r.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-start">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="gap-1">
                <RiFlagLine aria-hidden /> {r.reason}
              </Badge>
              <span>
                {r.reporters} {r.reporters === 1 ? "reader" : "readers"} · {relativeTime(r.reportedAt)}
              </span>
            </div>
            <Link href={`/fact-checks/${r.reportId}`} className="font-medium hover:text-primary">
              {r.title}
            </Link>
            <p className="border-l-2 pl-2 text-sm text-muted-foreground italic">“{r.sample}”</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => resolve(r.id, "Sent to expert review")}>
              Send to review
            </Button>
            <Button variant="ghost" size="sm" onClick={() => resolve(r.id, "Report dismissed")}>
              Dismiss
            </Button>
            {r.reason === "Offensive comment" && (
              <Button variant="destructive" size="sm" onClick={() => resolve(r.id, "Comment removed")}>
                Remove comment
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

// FR-RATE-07: detect and suppress coordinated rating manipulation.
function Manipulation() {
  const [items, setItems] = React.useState(MANIPULATION_SIGNALS)
  const resolve = (id: string, message: string) => {
    setItems((xs) => xs.filter((x) => x.id !== id))
    toast.success(message, { description: "Scores recalculated. Logged in the audit trail." })
  }

  if (items.length === 0) return <Done title="No suspicious rating activity" />
  return (
    <ul className="flex flex-col divide-y border bg-card">
      {items.map((m) => {
        const Vote = m.direction === "accurate" ? RiThumbUpLine : RiThumbDownLine
        return (
          <li key={m.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-start">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="destructive" className="gap-1">
                  <RiRobot2Line aria-hidden /> {Math.round(m.confidence * 100)}% likely coordinated
                </Badge>
                <span className="inline-flex items-center gap-1">
                  <Vote className="size-3.5" aria-hidden /> {m.accounts} “{m.direction}” ratings in {m.window}
                </span>
              </div>
              <Link href={`/fact-checks/${m.reportId}`} className="font-medium hover:text-primary">
                {m.title}
              </Link>
              <p className="text-sm text-muted-foreground">{m.pattern}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="destructive" size="sm" onClick={() => resolve(m.id, `${m.accounts} ratings discounted`)}>
                Discount ratings
              </Button>
              <Button variant="outline" size="sm" onClick={() => resolve(m.id, "Accounts suspended and ratings discounted")}>
                Suspend accounts
              </Button>
              <Button variant="ghost" size="sm" onClick={() => resolve(m.id, "Marked as genuine")}>
                Not manipulation
              </Button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function Moderation() {
  return (
    <Tabs defaultValue="reports" className="gap-4">
      <TabsList>
        <TabsTrigger value="reports">Reported content ({CONTENT_REPORTS.length})</TabsTrigger>
        <TabsTrigger value="manipulation">Rating manipulation ({MANIPULATION_SIGNALS.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="reports">
        <Reports />
      </TabsContent>
      <TabsContent value="manipulation">
        <Manipulation />
      </TabsContent>
    </Tabs>
  )
}
