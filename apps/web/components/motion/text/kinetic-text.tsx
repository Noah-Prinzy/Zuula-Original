import { cn } from "@/lib/utils"

// Headline text that enters word by word (like SplitText) and reacts to the pointer: hovering a
// word lifts its letters in a quick wave and dims the other words, so the hovered word takes
// the emphasis. Words listed in `highlight` get a marker stroke drawn behind them.
// Screen readers get the whole string once; the animated letters are aria-hidden.
// Styles: "Text emphasis" block in globals.css.
export function KineticText({
  text,
  delay = 0,
  offset = 0,
  highlight = [],
  className,
}: {
  text: string
  /** Milliseconds before the first word starts. */
  delay?: number
  /** Stagger index of the first word, for text split across several components in one line. */
  offset?: number
  /** Words (case-insensitive, punctuation ignored) to draw a marker behind. */
  highlight?: string[]
  className?: string
}) {
  const marked = new Set(highlight.map(normalise))
  const words = text.split(/\s+/).filter(Boolean)

  return (
    <span className={cn("kinetic", className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map((word, i) => (
          <span key={i}>
            {i > 0 && " "}
            <span
              className="split-word kinetic-word"
              style={{ "--i": offset + i, "--base": `${delay}ms` } as React.CSSProperties}
            >
              {/* The marker sits on an inner span: split-word already owns the word's animation. */}
              <span className={cn(marked.has(normalise(word)) && "em-mark")}>
                {[...word].map((ch, c) => (
                  <span key={c} className="kinetic-char" style={{ "--c": c } as React.CSSProperties}>
                    {ch}
                  </span>
                ))}
              </span>
            </span>
          </span>
        ))}
      </span>
    </span>
  )
}

function normalise(word: string) {
  return word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "")
}
