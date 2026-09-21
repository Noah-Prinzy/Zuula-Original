import { useTranslations } from "next-intl"

import { ZuulaMark } from "@/components/brand/zuula-mark"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

// Shown by loading.tsx while a route streams in: the Zuula lens scanning, then checking,
// then a skeleton of a typical page so the layout doesn't jump.
export function PageLoader({
  className,
  label,
  skeleton = true,
}: {
  className?: string
  label?: string
  skeleton?: boolean
}) {
  const t = useTranslations("Common")
  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col gap-10 py-10", className)}>
      <div className="flex flex-col items-center gap-4 py-6">
        <ZuulaMark animated className="size-16 overflow-visible" />
        <p className="font-heading text-sm font-semibold tracking-widest text-muted-foreground uppercase">
          {label ?? t("loading")}
          <span className="motion-safe:animate-pulse">…</span>
        </p>
      </div>

      {skeleton && (
        <div className="flex flex-col gap-6" aria-hidden>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
