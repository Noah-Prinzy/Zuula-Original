import { RiCheckLine, RiCloseLine } from "@remixicon/react"
import { useTranslations } from "next-intl"

import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import type { StepDef } from "@/lib/analysis"
import { cn } from "@/lib/utils"

export type AnalysisState = "running" | "done" | "error"

// Live pipeline steps for a submission. `current` is the index of the active step.
export function AnalysisProgress({
  steps,
  current,
  state,
  error,
  className,
}: {
  steps: StepDef[]
  current: number
  state: AnalysisState
  error?: string
  className?: string
}) {
  const t = useTranslations("Status")
  const completed = state === "done" ? steps.length : current
  const percent = Math.round((completed / steps.length) * 100)
  const active = steps[Math.min(current, steps.length - 1)]
  const label = (step: StepDef) => t(`steps.${step.id}.label`)

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="font-medium">
            {state === "done"
              ? t("progress.complete")
              : state === "error"
                ? t("progress.stopped")
                : t("progress.active", { step: label(active) })}
          </span>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">{percent}%</span>
        </div>
        <Progress
          value={percent}
          aria-label={t("progressTitle")}
          className={cn(state === "error" && "[&>div]:bg-destructive")}
        />
      </div>

      {/* Announce step changes to screen readers without reading the whole list. */}
      <p className="sr-only" aria-live="polite">
        {state === "done"
          ? t("progress.srComplete")
          : state === "error"
            ? t("progress.srError", { error: error ?? "" })
            : label(active)}
      </p>

      <ol className="flex flex-col">
        {steps.map((step, i) => {
          const status =
            state === "done" || i < current
              ? "done"
              : i === current
                ? state === "error"
                  ? "error"
                  : "active"
                : "pending"

          return (
            <li key={step.id} className="relative flex gap-3 pb-4 last:pb-0">
              {i < steps.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-6 bottom-0 left-2.75 w-px",
                    status === "done" ? "bg-verdict-authentic/60" : "bg-border"
                  )}
                />
              )}
              <span
                aria-hidden
                className={cn(
                  "relative z-10 flex size-6 shrink-0 items-center justify-center border bg-background",
                  status === "done" && "border-verdict-authentic bg-verdict-authentic text-background",
                  status === "active" && "border-primary text-primary",
                  status === "error" && "border-destructive bg-destructive text-background",
                  status === "pending" && "text-muted-foreground"
                )}
              >
                {status === "done" ? (
                  <RiCheckLine className="size-3.5" />
                ) : status === "active" ? (
                  <Spinner className="size-3.5" />
                ) : status === "error" ? (
                  <RiCloseLine className="size-3.5" />
                ) : (
                  <span className="font-mono text-[10px]">{i + 1}</span>
                )}
              </span>
              <div className="flex min-w-0 flex-col pt-0.5">
                <span
                  className={cn(
                    "text-sm",
                    status === "pending" ? "text-muted-foreground" : "font-medium",
                    status === "error" && "text-destructive"
                  )}
                >
                  {label(step)}
                  <span className="sr-only">{` — ${t(`progress.status.${status}`)}`}</span>
                </span>
                {(status === "active" || status === "error") && (
                  <span className={cn("text-xs", status === "error" ? "text-destructive" : "text-muted-foreground")}>
                    {status === "error" ? error : t(`steps.${step.id}.detail`)}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
