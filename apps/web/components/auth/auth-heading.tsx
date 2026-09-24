import type { RemixiconComponentType } from "@remixicon/react"

import { KineticText } from "@/components/motion/text/kinetic-text"
import { cn } from "@/lib/utils"

export function AuthHeading({
  title,
  description,
  icon: Icon,
  className,
}: {
  title: string
  description?: React.ReactNode
  icon?: RemixiconComponentType
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Icon && (
        <span className="enter mb-2 flex size-10 items-center justify-center bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden />
        </span>
      )}
      <h1 className="font-heading text-2xl font-bold tracking-tight">
        <KineticText text={title} delay={Icon ? 90 : 0} />
      </h1>
      {description && (
        <p className="enter text-sm text-muted-foreground" style={{ "--d": 2 } as React.CSSProperties}>
          {description}
        </p>
      )}
    </div>
  )
}
