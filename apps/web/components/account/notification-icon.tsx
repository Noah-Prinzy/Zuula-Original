import {
  RiAlarmWarningLine,
  RiAwardLine,
  RiFileCheckLine,
  RiNotification3Line,
  RiUserStarLine,
} from "@remixicon/react"
import { useTranslations } from "next-intl"

import type { NotificationKind } from "@/lib/mock/account"
import { cn } from "@/lib/utils"

// Labels live in Account.notifications.kinds.<kind>.
const META: Record<NotificationKind, { icon: typeof RiFileCheckLine; className: string }> = {
  "verdict-ready": { icon: RiFileCheckLine, className: "bg-verdict-authentic/10 text-verdict-authentic" },
  "topic-alert": { icon: RiNotification3Line, className: "bg-primary/10 text-primary" },
  "review-outcome": { icon: RiUserStarLine, className: "bg-verdict-ai-generated/10 text-verdict-ai-generated" },
  broadcast: { icon: RiAlarmWarningLine, className: "bg-verdict-false/10 text-verdict-false" },
  accreditation: { icon: RiAwardLine, className: "bg-muted text-muted-foreground" },
}

export function useNotificationLabel() {
  const t = useTranslations("Account.notifications.kinds")
  return (kind: NotificationKind) => t(kind)
}

export function NotificationIcon({ kind, className }: { kind: NotificationKind; className?: string }) {
  const { icon: Icon, className: tone } = META[kind]
  return (
    <span className={cn("flex size-8 shrink-0 items-center justify-center", tone, className)} aria-hidden>
      <Icon className="size-4" />
    </span>
  )
}
