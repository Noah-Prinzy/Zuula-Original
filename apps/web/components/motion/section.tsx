import { KineticText } from "@/components/motion/text/kinetic-text"
import { ScrambleText } from "@/components/motion/text/scramble-text"
import { cn } from "@/lib/utils"

// A page band that fills the viewport below the sticky header (see `section-screen` in
// globals.css), so the next band never peeks in from below. Wrap a page in <SnapPage> to
// get gentle snapping between bands.
export function ScreenSection({
  className,
  children,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section {...props} className={cn("section-screen", className)}>
      {children}
    </section>
  )
}

export function SnapPage({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("snap-page", className)}>{children}</div>
}

// Section heading with an accent rule that draws in when the heading scrolls into view.
export function SectionTitle({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  id,
}: {
  eyebrow?: string
  title: string
  description?: string
  align?: "left" | "center"
  className?: string
  id?: string
}) {
  return (
    <div
      data-reveal
      className={cn(
        "flex flex-col gap-3",
        align === "center" && "items-center text-center",
        className
      )}
    >
      {eyebrow && (
        <p className="font-heading text-xs font-semibold tracking-widest text-primary uppercase">
          <ScrambleText text={eyebrow} />
        </p>
      )}
      <h2
        id={id}
        className="rule-draw font-heading text-3xl font-bold tracking-tight text-balance md:text-4xl"
      >
        <KineticText text={title} />
      </h2>
      {description && (
        <p className="max-w-2xl text-base text-balance text-muted-foreground md:text-lg">
          {description}
        </p>
      )}
    </div>
  )
}
