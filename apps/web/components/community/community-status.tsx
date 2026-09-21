import {
  RiAlertLine,
  RiGroupLine,
  RiPauseCircleLine,
  RiShieldStarLine,
  type RemixiconComponentType,
} from "@remixicon/react"

import type { CommunityStatus } from "@/lib/community"
import { cn } from "@/lib/utils"

type StatusMeta = {
  label: string
  title: string
  description: string
  icon: RemixiconComponentType
  className: string
}

// §9.2 escalation states. "standard" (CCS 70–89 or too few ratings) shows nothing.
export const COMMUNITY_STATUS_META: Record<Exclude<CommunityStatus, "standard">, StatusMeta> = {
  verified: {
    label: "Community Verified",
    title: "Community Verified",
    description: "At least 90% of weighted community ratings agree with this verdict.",
    icon: RiShieldStarLine,
    className: "border-verdict-authentic/40 bg-verdict-authentic/10 text-verdict-authentic",
  },
  questioned: {
    label: "Questioned",
    title: "The community questions this verdict",
    description:
      "Between 40% and 69% of ratings agree. Read the sources and comments before sharing.",
    icon: RiGroupLine,
    className: "border-verdict-likely-false/40 bg-verdict-likely-false/10 text-verdict-likely-false",
  },
  escalated: {
    label: "Under Expert Review",
    title: "Sent for expert review",
    description:
      "Fewer than 40% of over 100 ratings agree with this verdict. An Expert Reviewer will check it within 48 hours.",
    icon: RiAlertLine,
    className: "border-verdict-false/40 bg-verdict-false/10 text-verdict-false",
  },
  suspended: {
    label: "Suspended",
    title: "Verdict suspended pending review",
    description:
      "Fewer than 20% of over 200 ratings agree. The verdict is hidden from search until an expert reviews it.",
    icon: RiPauseCircleLine,
    className: "border-verdict-false/60 bg-verdict-false/15 text-verdict-false",
  },
}

// Compact badge for cards and lists.
export function CommunityBadge({
  status,
  className,
}: {
  status: CommunityStatus
  className?: string
}) {
  if (status === "standard") return null
  const meta = COMMUNITY_STATUS_META[status]
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit items-center gap-1 border px-1.5 text-xs font-medium whitespace-nowrap",
        meta.className,
        className
      )}
    >
      <meta.icon className="size-3" aria-hidden />
      {meta.label}
    </span>
  )
}

// Full-width banner at the top of a report.
export function CommunityStatusBanner({
  status,
  className,
}: {
  status: CommunityStatus
  className?: string
}) {
  if (status === "standard") return null
  const meta = COMMUNITY_STATUS_META[status]
  return (
    <div
      role={status === "verified" ? "status" : "alert"}
      className={cn("flex items-start gap-3 border p-3", meta.className, className)}
    >
      <meta.icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="flex flex-col gap-0.5">
        <p className="font-heading text-sm font-bold">{meta.title}</p>
        <p className="text-sm text-foreground/80">{meta.description}</p>
      </div>
    </div>
  )
}
