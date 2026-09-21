import {
  RiAlarmWarningLine,
  RiAwardLine,
  RiFileCheckLine,
  RiNotification3Line,
  RiUserStarLine,
} from "@remixicon/react"

import type { NotificationKind } from "@/lib/mock/account"
import { cn } from "@/lib/utils"

const META: Record<NotificationKind, { icon: typeof RiFileCheckLine; className: string; label: string }> = {
  "verdict-ready": { icon: RiFileCheckLine, className: "bg-verdict-authentic/10 text-verdict-authentic", label: "Result ready" },
  "topic-alert": { icon: RiNotification3Line, className: "bg-primary/10 text-primary", label: "Topic alert" },
  "review-outcome": { icon: RiUserStarLine, className: "bg-verdict-ai-generated/10 text-verdict-ai-generated", label: "Expert review" },
  broadcast: { icon: RiAlarmWarningLine, className: "bg-verdict-false/10 text-verdict-false", label: "Emergency alert" },
  accreditation: { icon: RiAwardLine, className: "bg-muted text-muted-foreground", label: "Account" },
}

export function notificationLabel(kind: NotificationKind) {
  return META[kind].label
}

export function NotificationIcon({ kind, className }: { kind: NotificationKind; className?: string }) {
  const { icon: Icon, className: tone } = META[kind]
  return (
    <span className={cn("flex size-8 shrink-0 items-center justify-center", tone, className)} aria-hidden>
      <Icon className="size-4" />
    </span>
  )
}
