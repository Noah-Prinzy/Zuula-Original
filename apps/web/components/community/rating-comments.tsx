"use client"

import * as React from "react"
import { RiThumbDownFill, RiThumbUpFill } from "@remixicon/react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { RATING_WEIGHTS } from "@/lib/community"
import { ROLE_LABELS } from "@/lib/roles"
import type { RatingComment } from "@/lib/types/fact-check"
import { cn, initials } from "@/lib/utils"
import { formatDate } from "@/lib/verdicts"

type Filter = "all" | "accurate" | "inaccurate"

// FR-RATE-09: reasons people gave with their ratings.
export function RatingComments({
  comments,
  className,
}: {
  comments: RatingComment[]
  className?: string
}) {
  const [filter, setFilter] = React.useState<Filter>("all")
  const shown = filter === "all" ? comments : comments.filter((c) => c.vote === filter)
  const count = (v: Filter) => (v === "all" ? comments.length : comments.filter((c) => c.vote === v).length)

  if (comments.length === 0) {
    return <p className="text-sm text-muted-foreground">No one has explained their rating yet.</p>
  }

  return (
    <div className={cn("@container flex flex-col gap-3", className)}>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={filter}
        onValueChange={(v) => v && setFilter(v as Filter)}
        aria-label="Filter comments"
        className="w-fit"
      >
        {(["all", "accurate", "inaccurate"] as const).map((f) => (
          <ToggleGroupItem key={f} value={f} className="capitalize">
            {f} ({count(f)})
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <ul className="grid gap-2 @3xl:grid-cols-2">
        {shown.map((c) => {
          const accurate = c.vote === "accurate"
          const Icon = accurate ? RiThumbUpFill : RiThumbDownFill
          return (
            <li key={c.id} className="flex gap-3 border bg-card p-3">
              <Avatar className="size-8">
                <AvatarFallback>{initials(c.author)}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                  <span className="font-semibold">{c.author}</span>
                  {c.role !== "public" && (
                    <span className="border px-1 text-muted-foreground">
                      {ROLE_LABELS[c.role]} · {RATING_WEIGHTS[c.role]}×
                    </span>
                  )}
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 font-medium",
                      accurate ? "text-verdict-authentic" : "text-verdict-false"
                    )}
                  >
                    <Icon className="size-3" aria-hidden />
                    {accurate ? "Accurate" : "Inaccurate"}
                  </span>
                  <time dateTime={c.createdAt} className="ml-auto text-muted-foreground">
                    {formatDate(c.createdAt)}
                  </time>
                </div>
                <p className="text-sm">{c.body}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
