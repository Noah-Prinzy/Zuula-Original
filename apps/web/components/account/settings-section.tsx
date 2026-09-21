import { cn } from "@/lib/utils"

// Card used on the Account pages: heading + description on top, content, optional footer.
export function SettingsSection({
  id,
  title,
  description,
  children,
  footer,
  tone = "default",
  className,
}: {
  id: string
  title: string
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  tone?: "default" | "danger"
  className?: string
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn("flex flex-col border bg-card", tone === "danger" && "border-destructive/40", className)}
    >
      <div className="flex flex-col gap-1 border-b p-4 md:p-5">
        <h2 id={id} className={cn("font-heading text-base font-bold", tone === "danger" && "text-destructive")}>
          {title}
        </h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-5">{children}</div>
      {footer && (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t bg-muted/30 px-4 py-3 md:px-5">
          {footer}
        </div>
      )}
    </section>
  )
}
