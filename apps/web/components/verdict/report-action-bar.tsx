"use client"

import { RiChatCheckLine, RiLinksLine, RiShareForwardLine } from "@remixicon/react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { cn } from "@/lib/utils"

// A report's own bottom bar on phones, in place of the tab bar (bottom-nav.tsx hides it here,
// as native apps do on a pushed screen; the app bar's back button leads out). The things
// people come to a report to do, in thumb reach: rate it, check its sources, pass it on.
// Sharing uses the phone's share sheet (WhatsApp, where most of these claims travel), or
// copies the link where there is none.
export function ReportActionBar({ title, sources }: { title: string; sources: number }) {
  const t = useTranslations("Report")

  async function share() {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title, url })
      else {
        await navigator.clipboard.writeText(url)
        toast.success(t("linkCopied"))
      }
    } catch (e) {
      if ((e as DOMException)?.name !== "AbortError") toast.error(t("shareFailed"))
    }
  }

  const item =
    "press-tint flex flex-1 flex-col items-center justify-center gap-0.5 text-[0.6875rem] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset [&_svg]:size-5"

  return (
    <nav
      aria-label={t("actions")}
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="grid h-14 grid-cols-3">
        <a href="#rating" className={item}>
          <RiChatCheckLine aria-hidden />
          {t("rate")}
        </a>
        <a href="#sources" className={item}>
          <RiLinksLine aria-hidden />
          <span>
            {t("sources")} <span className="text-muted-foreground tabular-nums">{sources}</span>
          </span>
        </a>
        <button type="button" onClick={() => void share()} className={cn(item, "font-semibold")}>
          <RiShareForwardLine className="text-primary" aria-hidden />
          {t("share")}
        </button>
      </div>
    </nav>
  )
}
