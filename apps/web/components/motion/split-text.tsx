import { cn } from "@/lib/utils"

// Animates a line of text in word by word. Screen readers get the whole string once.
// On its own it plays on first paint; inside a [data-reveal] element it waits for the reveal.
export function SplitText({
  text,
  delay = 0,
  className,
}: {
  text: string
  /** Milliseconds before the first word starts. */
  delay?: number
  className?: string
}) {
  const words = text.split(/(\s+)/).filter(Boolean)
  let i = 0

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map((word, k) =>
          /^\s+$/.test(word) ? (
            " "
          ) : (
            <span
              key={k}
              className={cn("split-word")}
              style={{ "--i": i++, "--base": `${delay}ms` } as React.CSSProperties}
            >
              {word}
            </span>
          )
        )}
      </span>
    </span>
  )
}
