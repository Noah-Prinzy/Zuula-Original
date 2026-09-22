"use client"

import * as React from "react"
import Link from "next/link"
import { RiFlagLine, RiRobot2Line, RiThumbDownLine, RiThumbUpLine } from "@remixicon/react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CONTENT_REPORTS, MANIPULATION_SIGNALS } from "@/lib/mock/admin"
import { useRelativeTime } from "@/hooks/use-relative-time"

function Done({ title }: { title: string }) {
  const t = useTranslations("Admin.moderation")
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{t("doneBody")}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

function Reports() {
  const [items, setItems] = React.useState(CONTENT_REPORTS)
  const t = useTranslations("Admin.moderation")
  const relativeTime = useRelativeTime()
  const resolve = (id: string, message: string) => {
    setItems((xs) => xs.filter((x) => x.id !== id))
    toast.success(message, { description: t("resolvedBody") })
  }

  if (items.length === 0) return <Done title={t("noReports")} />
  return (
    <ul data-reveal="stagger" className="flex flex-col divide-y border bg-card">
      {items.map((r) => (
        <li key={r.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-start">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="gap-1">
                <RiFlagLine aria-hidden /> {r.reason}
              </Badge>
              <span>
                {t("readers", { count: r.reporters })} · {relativeTime(r.reportedAt)}
              </span>
            </div>
            <Link href={`/fact-checks/${r.reportId}`} className="font-medium hover:text-primary">
              {r.title}
            </Link>
            <p className="border-l-2 pl-2 text-sm text-muted-foreground italic">“{r.sample}”</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => resolve(r.id, t("sentToReview"))}>
              {t("sendToReview")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => resolve(r.id, t("dismissed"))}>
              {t("dismiss")}
            </Button>
            {r.reason === "Offensive comment" && (
              <Button variant="destructive" size="sm" onClick={() => resolve(r.id, t("commentRemoved"))}>
                {t("removeComment")}
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
  const t = useTranslations("Admin.moderation")
  const resolve = (id: string, message: string) => {
    setItems((xs) => xs.filter((x) => x.id !== id))
    toast.success(message, { description: t("recalculatedBody") })
  }

  if (items.length === 0) return <Done title={t("noManipulation")} />
  return (
    <ul data-reveal="stagger" className="flex flex-col divide-y border bg-card">
      {items.map((m) => {
        const Vote = m.direction === "accurate" ? RiThumbUpLine : RiThumbDownLine
        return (
          <li key={m.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-start">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="destructive" className="gap-1">
                  <RiRobot2Line aria-hidden /> {t("likelyCoordinated", { percent: Math.round(m.confidence * 100) })}
                </Badge>
                <span className="inline-flex items-center gap-1">
                  <Vote className="size-3.5" aria-hidden /> {t("burst", { count: m.accounts, direction: m.direction, window: m.window })}
                </span>
              </div>
              <Link href={`/fact-checks/${m.reportId}`} className="font-medium hover:text-primary">
                {m.title}
              </Link>
              <p className="text-sm text-muted-foreground">{m.pattern}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="destructive" size="sm" onClick={() => resolve(m.id, t("discounted", { count: m.accounts }))}>
                {t("discount")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => resolve(m.id, t("suspended"))}>
                {t("suspendAccounts")}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => resolve(m.id, t("genuine"))}>
                {t("notManipulation")}
              </Button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function Moderation() {
  const t = useTranslations("Admin.moderation")
  return (
    <Tabs defaultValue="reports" className="gap-4">
      <TabsList>
        <TabsTrigger value="reports">{t("reportsTab", { count: CONTENT_REPORTS.length })}</TabsTrigger>
        <TabsTrigger value="manipulation">{t("manipulationTab", { count: MANIPULATION_SIGNALS.length })}</TabsTrigger>
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
