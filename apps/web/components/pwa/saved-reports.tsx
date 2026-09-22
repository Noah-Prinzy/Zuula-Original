"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  RiArrowRightSLine,
  RiFileList3Line,
  RiRefreshLine,
  RiWifiLine,
  RiWifiOffLine,
} from "@remixicon/react"
import { useFormatter, useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"

import { useOnline } from "./use-online"

// Must match REPORTS in public/sw.js.
const REPORTS_CACHE = "zuula-reports"

type SavedReport = {
  href: string
  title: string
  summary: string
  savedAt: Date | null
}

// Reads the reports the service worker saved while the user browsed, newest first.
async function readSavedReports(): Promise<SavedReport[]> {
  const cache = await caches.open(REPORTS_CACHE)
  const requests = await cache.keys()
  const parser = new DOMParser()
  const reports = await Promise.all(
    requests.map(async (request) => {
      const res = await cache.match(request)
      if (!res) return null
      const doc = parser.parseFromString(await res.text(), "text/html")
      const savedAt = res.headers.get("x-zuula-saved-at")
      return {
        href: new URL(request.url).pathname,
        title: doc.title,
        summary:
          doc
            .querySelector('meta[name="description"]')
            ?.getAttribute("content") ?? "",
        savedAt: savedAt ? new Date(savedAt) : null,
      }
    })
  )
  return reports
    .filter((r): r is SavedReport => r !== null)
    .sort((a, b) => (b.savedAt?.getTime() ?? 0) - (a.savedAt?.getTime() ?? 0))
}

export function SavedReports() {
  const t = useTranslations("Offline")
  const format = useFormatter()
  const [reports, setReports] = useState<SavedReport[] | null>(null)
  const online = useOnline()

  useEffect(() => {
    const saved = "caches" in window ? readSavedReports() : Promise.resolve([])
    saved.then(setReports, () => setReports([]))
  }, [])

  return (
    <div className="flex flex-col gap-8">
      <div
        role="status"
        className="flex flex-col gap-3 border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="flex items-start gap-3 text-sm">
          {online ? (
            <RiWifiLine
              className="mt-0.5 size-5 shrink-0 text-verdict-authentic"
              aria-hidden
            />
          ) : (
            <RiWifiOffLine
              className="mt-0.5 size-5 shrink-0 text-primary"
              aria-hidden
            />
          )}
          {online ? t("backOnline") : t("stillOffline")}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="w-fit"
        >
          <RiRefreshLine aria-hidden /> {t("retry")}
        </Button>
      </div>

      <section aria-labelledby="saved-title" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="saved-title" className="font-heading text-xl font-bold">
            {t("savedTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("savedDescription")}
          </p>
        </div>

        {reports === null ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <RiFileList3Line aria-hidden />
              </EmptyMedia>
              <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
              <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" asChild>
                <Link href="/fact-checks">{t("browseLibrary")}</Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <ul className="flex flex-col divide-y border bg-card">
            {reports.map((r) => (
              <li
                key={r.href}
                className="relative flex items-start gap-3 p-4 hover:bg-muted/50"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Link
                    href={r.href}
                    className="font-medium text-balance after:absolute after:inset-0 hover:text-primary"
                  >
                    {r.title}
                  </Link>
                  {r.summary && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {r.summary}
                    </p>
                  )}
                  {r.savedAt && (
                    <p className="text-xs text-muted-foreground">
                      {t("savedAt", { when: format.relativeTime(r.savedAt) })}
                    </p>
                  )}
                </div>
                <RiArrowRightSLine
                  className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
