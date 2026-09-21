import { cn } from "@/lib/utils"

// Used by route-group templates: remounts on every navigation, so the page eases in.
export function PageTransition({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={cn("page-enter", className)}>{children}</div>
}
