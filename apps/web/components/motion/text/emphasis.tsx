import { cn } from "@/lib/utils"

// Inline emphasis for a word or short phrase inside running text.
// - "marker": a highlighter stroke sweeps in behind the text, and fills the line on hover.
// - "scribble": a hand-drawn underline draws itself in, and redraws on hover.
// Both play on first paint, or when an enclosing [data-reveal] element is revealed.
// Styles: "Text emphasis" block in globals.css.
export function Emphasis({
  variant = "marker",
  tone = "primary",
  delay,
  className,
  children,
}: {
  variant?: "marker" | "scribble"
  /** "light" for the crimson brand panels; "solid" for white text on photos. */
  tone?: "primary" | "light" | "solid"
  /** Milliseconds before the stroke draws in. */
  delay?: number
  className?: string
  children: React.ReactNode
}) {
  const style = delay === undefined ? undefined : ({ "--mark-delay": `${delay}ms` } as React.CSSProperties)

  if (variant === "scribble") {
    return (
      <span className={cn("em-scribble", tone !== "primary" && "em-scribble-light", className)} style={style}>
        {children}
        <svg aria-hidden viewBox="0 0 200 12" preserveAspectRatio="none" focusable="false">
          <path d="M2 8.5C38 4 76 3 112 4.8c30 1.4 58 3 86 1.2" pathLength={1} />
        </svg>
      </span>
    )
  }

  return (
    <span className={cn("em-mark", tone !== "primary" && `em-mark-${tone}`, className)} style={style}>
      {children}
    </span>
  )
}
