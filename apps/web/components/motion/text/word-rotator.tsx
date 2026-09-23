"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

// A word carousel for headlines: cycles through `words`, the outgoing word's letters rolling
// up and out while the next word's letters rise in, and the slot's width easing between words
// so the surrounding text glides instead of jumping. Pauses while hovered or focused, while
// the tab is hidden, and never rotates under prefers-reduced-motion. Screen readers get the
// first word only, so the sentence reads once and does not chatter.
// Styles: "Text emphasis" block in globals.css.
export function WordRotator({
  words,
  interval = 2600,
  delay = 0,
  marker = false,
  className,
}: {
  words: string[]
  /** Milliseconds each word stays on screen. */
  interval?: number
  /** Milliseconds before the first word rises in on page load. */
  delay?: number
  /** Draw a highlighter stroke behind the slot (tracks the slot's width). */
  marker?: boolean
  className?: string
}) {
  const [{ index, previous }, setSlot] = useState<{ index: number; previous: number | null }>({
    index: 0,
    previous: null,
  })
  const [width, setWidth] = useState<number>()

  // New words (e.g. after a language switch): start again from the first one.
  const wordsKey = words.join("|")
  const [seenKey, setSeenKey] = useState(wordsKey)
  if (seenKey !== wordsKey) {
    setSeenKey(wordsKey)
    setSlot({ index: 0, previous: null })
  }
  const [paused, setPaused] = useState(false)
  const items = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    if (words.length < 2 || paused || matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = window.setInterval(() => {
      if (document.hidden) return
      setSlot(({ index: i }) => ({ index: (i + 1) % words.length, previous: i }))
    }, interval)
    return () => window.clearInterval(id)
  }, [words.length, interval, paused, wordsKey])

  // Track the active word's width, including when the heading's font size changes.
  useIsoLayoutEffect(() => {
    const el = items.current[index]
    if (!el) return
    const measure = () => setWidth(el.offsetWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [index, wordsKey])

  return (
    <span
      className={cn("word-rotator", marker && "word-rotator-marker", className)}
      style={{ width, "--base": previous === null ? `${delay}ms` : "0ms" } as React.CSSProperties}
      // Until the first rotation the word is part of the first paint: it settles into place
      // rather than fading in (globals.css), so it never delays Largest Contentful Paint.
      data-initial={previous === null || undefined}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <span className="sr-only">{words[0]}</span>
      {words.map((word, k) => (
        <span
          key={`${wordsKey}:${k}`}
          aria-hidden
          ref={(el) => {
            items.current[k] = el
          }}
          className="word-rotator-item"
          data-state={k === index ? "in" : k === previous ? "out" : "idle"}
        >
          {[...word].map((ch, c) =>
            ch === " " ? (
              " "
            ) : (
              <span key={c} className="word-rotator-char" style={{ "--c": c } as React.CSSProperties}>
                {ch}
              </span>
            )
          )}
        </span>
      ))}
    </span>
  )
}
