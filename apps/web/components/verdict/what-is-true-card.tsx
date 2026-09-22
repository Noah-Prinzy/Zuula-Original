import { RiCheckLine, RiCloseLine } from "@remixicon/react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"

// FR-EXPLAIN-07: "What is True" alongside "What is False".
export function WhatIsTrueCard({
  whatIsFalse,
  whatIsTrue,
  className,
}: {
  whatIsFalse: string[]
  whatIsTrue: string[]
  className?: string
}) {
  const t = useTranslations("Verdicts.findings")
  if (whatIsFalse.length === 0 && whatIsTrue.length === 0) return null

  const columns = [
    {
      title: t("false"),
      items: whatIsFalse,
      icon: RiCloseLine,
      tone: "text-verdict-false",
      bar: "bg-verdict-false",
    },
    {
      title: t("true"),
      items: whatIsTrue,
      icon: RiCheckLine,
      tone: "text-verdict-authentic",
      bar: "bg-verdict-authentic",
    },
  ].filter((c) => c.items.length > 0)

  return (
    // Container query: side by side only when the card itself is wide enough.
    <div className={cn("@container", className)}>
      <div className="grid gap-px border bg-border @xl:grid-cols-2">
        {columns.map((col) => (
          <section key={col.title} className="relative bg-card p-4 pl-5">
            <span
              className={cn("absolute inset-y-0 left-0 w-1", col.bar)}
              aria-hidden
            />
            <h3 className={cn("mb-2 font-heading text-sm font-bold", col.tone)}>
              {col.title}
            </h3>
            <ul className="flex flex-col gap-2">
              {col.items.map((item) => (
                <li key={item} className="flex gap-2 text-sm">
                  <col.icon
                    className={cn("mt-0.5 size-4 shrink-0", col.tone)}
                    aria-hidden
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
