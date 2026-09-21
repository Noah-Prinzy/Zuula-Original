"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+/<>?"
const FRAME_MS = 32

// Short labels (eyebrows, badges) that "decode": letters flicker through random glyphs and
// resolve left to right, like a claim being checked. Runs once when the text appears (on paint,
// or when an enclosing [data-reveal] element is revealed) and again on hover. Each letter keeps
// its real width, so the label never jitters. Off under prefers-reduced-motion.
export function ScrambleText({ text, className }: { text: string; className?: string }) {
  const [shown, setShown] = useState(text)
  // New text (e.g. after a language switch) shows at once; the effect below re-decodes it.
  const [seen, setSeen] = useState(text)
  if (seen !== text) {
    setSeen(text)
    setShown(text)
  }
  const root = useRef<HTMLSpanElement>(null)
  const frame = useRef<number | null>(null)

  const run = useCallback(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return
    if (frame.current !== null) window.clearInterval(frame.current)
    let tick = 0
    frame.current = window.setInterval(() => {
      tick++
      setShown(
        [...text]
          .map((ch, i) =>
            ch === " " || tick > 3 + i * 1.4 ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
          )
          .join("")
      )
      if (tick > 3 + text.length * 1.4) {
        window.clearInterval(frame.current!)
        frame.current = null
      }
    }, FRAME_MS)
  }, [text])

  // Play once the text is on screen: reuse RevealObserver's data-revealed flag rather than
  // running a second IntersectionObserver.
  useEffect(() => {
    const host = root.current?.closest("[data-reveal]")
    let mo: MutationObserver | undefined
    if (!host || host.hasAttribute("data-revealed")) {
      run()
    } else {
      mo = new MutationObserver(() => {
        if (!host.hasAttribute("data-revealed")) return
        mo?.disconnect()
        run()
      })
      mo.observe(host, { attributes: true, attributeFilter: ["data-revealed"] })
    }
    return () => {
      mo?.disconnect()
      if (frame.current !== null) window.clearInterval(frame.current)
    }
  }, [run])

  return (
    <span ref={root} className={cn("scramble", className)} onPointerEnter={run}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {[...text].map((ch, i) =>
          ch === " " ? (
            " "
          ) : (
            <span key={i} className="scramble-char" data-busy={shown[i] !== ch || undefined}>
              <span className="scramble-ghost">{ch}</span>
              <span>{shown[i]}</span>
            </span>
          )
        )}
      </span>
    </span>
  )
}
