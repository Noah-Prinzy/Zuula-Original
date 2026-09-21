"use client"

import { RiArrowDownSLine, RiRobot2Line } from "@remixicon/react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { AISignal } from "@/lib/types/fact-check"
import { cn } from "@/lib/utils"

// FR-EXPLAIN-06: which signals triggered AI / manipulation detection.
export function AISignalsList({
  signals,
  className,
}: {
  signals: AISignal[]
  className?: string
}) {
  if (signals.length === 0) return null

  const triggered = signals.filter((s) => s.score >= s.threshold).length

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <RiRobot2Line className="size-4 text-verdict-ai-generated" aria-hidden />
        {triggered} of {signals.length} detection signals were triggered.
      </p>
      <ul className="flex flex-col divide-y border">
        {signals.map((signal) => {
          const pct = Math.round(signal.score * 100)
          const threshold = Math.round(signal.threshold * 100)
          const hit = signal.score >= signal.threshold

          return (
            <li key={signal.id}>
              <Collapsible>
                <CollapsibleTrigger className="group flex w-full flex-col gap-2 p-3 text-left hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                  <div className="flex w-full items-center gap-2">
                    <span className="text-sm font-medium">{signal.label}</span>
                    <span
                      className={cn(
                        "border px-1.5 text-[11px] font-medium",
                        hit
                          ? "border-verdict-ai-generated/40 bg-verdict-ai-generated/10 text-verdict-ai-generated"
                          : "text-muted-foreground"
                      )}
                    >
                      {hit ? "Triggered" : "Not triggered"}
                    </span>
                    <span className="ml-auto font-mono text-sm tabular-nums">{pct}%</span>
                    <RiArrowDownSLine
                      className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
                      aria-hidden
                    />
                  </div>
                  {/* Score bar with the detection threshold marked. */}
                  <div
                    className="relative h-1.5 w-full bg-muted"
                    role="img"
                    aria-label={`Score ${pct}%, threshold ${threshold}%`}
                  >
                    <div
                      className={cn(
                        "h-full",
                        hit ? "bg-verdict-ai-generated" : "bg-muted-foreground/50"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                    <div
                      className="absolute -top-1 h-3.5 w-0.5 bg-foreground"
                      style={{ left: `${threshold}%` }}
                      aria-hidden
                    />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 pb-3 text-sm text-muted-foreground">
                  <p>{signal.description}</p>
                  <p className="mt-1 text-xs">
                    Method: {signal.method} · Threshold {threshold}%
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
