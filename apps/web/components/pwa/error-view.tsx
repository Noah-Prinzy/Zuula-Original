"use client"

import Link from "next/link"
import { useEffect } from "react"
import {
  RiArrowGoBackLine,
  RiHome5Line,
  RiRefreshLine,
  RiWifiOffLine,
} from "@remixicon/react"
import { useTranslations } from "next-intl"

import { ZuulaMarkOutline } from "@/components/brand/zuula-mark"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { useOnline } from "./use-online"

// Shared body for the route-group error boundaries. `home` is where "back to safety" goes:
// the landing page for public/auth routes, the account overview inside the app.
export function ErrorView({
  error,
  reset,
  home = "/",
  className,
}: {
  error: Error & { digest?: string }
  reset: () => void
  home?: string
  className?: string
}) {
  const t = useTranslations("Errors")
  const offline = !useOnline()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div
      className={cn(
        "relative isolate flex flex-1 items-center justify-center overflow-hidden py-16",
        className
      )}
    >
      <ZuulaMarkOutline className="pointer-events-none absolute -right-20 -bottom-24 -z-10 size-[28rem] text-primary opacity-[0.06]" />
      <div
        role="alert"
        className="flex page-container max-w-xl flex-col items-start gap-5"
      >
        <p className="font-heading text-xs font-semibold tracking-widest text-primary uppercase">
          {t("eyebrow")}
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-balance md:text-4xl">
          {offline ? t("offlineTitle") : t("title")}
        </h1>
        <p className="text-base text-balance text-muted-foreground">
          {offline ? t("offlineDescription") : t("description")}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={reset}>
            <RiRefreshLine aria-hidden /> {t("retry")}
          </Button>
          {offline ? (
            <Button variant="outline" asChild>
              <Link href="/offline">
                <RiWifiOffLine aria-hidden /> {t("savedReports")}
              </Link>
            </Button>
          ) : (
            <Button variant="outline" asChild>
              <Link href={home}>
                {home === "/" ? (
                  <RiHome5Line aria-hidden />
                ) : (
                  <RiArrowGoBackLine aria-hidden />
                )}
                {home === "/" ? t("home") : t("back")}
              </Link>
            </Button>
          )}
        </div>
        {error.digest && (
          <p className="font-mono text-xs text-muted-foreground">
            {t("reference", { digest: error.digest })}
          </p>
        )}
      </div>
    </div>
  )
}
