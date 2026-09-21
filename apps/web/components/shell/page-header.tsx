import { KineticText } from "@/components/motion/text/kinetic-text"
import { cn } from "@/lib/utils"

const delay = (d: number) => ({ "--d": d }) as React.CSSProperties

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          <KineticText text={title} />
        </h1>
        {description && (
          <p className="enter text-sm text-muted-foreground" style={delay(2)}>
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="enter flex items-center gap-2" style={delay(3)}>
          {actions}
        </div>
      )}
    </div>
  )
}
