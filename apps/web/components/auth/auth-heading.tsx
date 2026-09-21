import type { RemixiconComponentType } from "@remixicon/react"

import { SplitText } from "@/components/motion/split-text"

export function AuthHeading({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description?: React.ReactNode
  icon?: RemixiconComponentType
}) {
  return (
    <div className="flex flex-col gap-2">
      {Icon && (
        <span className="enter mb-2 flex size-10 items-center justify-center bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden />
        </span>
      )}
      <h1 className="font-heading text-2xl font-bold tracking-tight">
        <SplitText text={title} delay={Icon ? 90 : 0} />
      </h1>
      {description && (
        <p className="enter text-sm text-muted-foreground" style={{ "--d": 2 } as React.CSSProperties}>
          {description}
        </p>
      )}
    </div>
  )
}
