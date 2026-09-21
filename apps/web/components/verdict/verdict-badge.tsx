import { cva, type VariantProps } from "class-variance-authority"

import type { Verdict } from "@/lib/types/fact-check"
import { cn } from "@/lib/utils"
import { VERDICT_META } from "@/lib/verdicts"

const verdictBadgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 border font-medium whitespace-nowrap",
  {
    variants: {
      size: {
        sm: "h-5 px-1.5 text-xs [&>svg]:size-3",
        md: "h-6 px-2 text-xs [&>svg]:size-3.5",
        lg: "h-8 px-3 text-sm [&>svg]:size-4",
      },
    },
    defaultVariants: { size: "md" },
  }
)

// Colour is never the only signal: every verdict has its own icon and label.
export function VerdictBadge({
  verdict,
  size,
  className,
}: { verdict: Verdict; className?: string } & VariantProps<typeof verdictBadgeVariants>) {
  const meta = VERDICT_META[verdict]
  const Icon = meta.icon

  return (
    <span
      data-verdict={verdict}
      className={cn(verdictBadgeVariants({ size }), meta.text, meta.bg, meta.border, className)}
    >
      <Icon aria-hidden />
      {meta.label}
    </span>
  )
}
