// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { Emphasis } from "@/components/motion/text/emphasis"
import { KineticText } from "@/components/motion/text/kinetic-text"
import { ScrambleText } from "@/components/motion/text/scramble-text"
import { WordRotator } from "@/components/motion/text/word-rotator"
import { setReducedMotion } from "@/test/media"

describe("KineticText", () => {
  it("gives screen readers the whole sentence once and hides the animated letters", () => {
    const { container } = render(<KineticText text="Check a claim" />)
    expect(screen.getByText("Check a claim")).toHaveClass("sr-only")
    const hidden = container.querySelector("[aria-hidden='true']")!
    expect(hidden.textContent?.replace(/\s+/g, " ")).toBe("Check a claim")
    expect(container.querySelectorAll(".kinetic-word")).toHaveLength(3)
    expect(container.querySelectorAll(".kinetic-char")).toHaveLength(11)
  })

  it("staggers words from an offset and delay", () => {
    const { container } = render(<KineticText text="before you share" delay={120} offset={3} />)
    const words = [...container.querySelectorAll<HTMLElement>(".kinetic-word")]
    expect(words.map((w) => w.style.getPropertyValue("--i"))).toEqual(["3", "4", "5"])
    expect(words[0].style.getPropertyValue("--base")).toBe("120ms")
  })

  it("marks highlighted words, ignoring case and punctuation", () => {
    const { container } = render(<KineticText text="Built for Uganda." highlight={["uganda"]} />)
    const marked = container.querySelectorAll(".em-mark")
    expect(marked).toHaveLength(1)
    expect(marked[0].textContent).toBe("Uganda.")
  })

  it("remounts the letters when the text changes (e.g. a language switch)", () => {
    const { container, rerender } = render(<KineticText text="Check a claim" />)
    const before = container.querySelector(".kinetic-word")
    rerender(<KineticText text="Kebera ekigambo" />)
    expect(screen.getByText("Kebera ekigambo")).toHaveClass("sr-only")
    expect(container.querySelector(".kinetic-word")).not.toBe(before)
  })
})

describe("Emphasis", () => {
  it("renders a marker by default, with tone and delay", () => {
    render(
      <Emphasis tone="solid" delay={400}>
        the sources
      </Emphasis>
    )
    const el = screen.getByText("the sources")
    expect(el).toHaveClass("em-mark", "em-mark-solid")
    expect(el.style.getPropertyValue("--mark-delay")).toBe("400ms")
  })

  it("renders a hand-drawn underline hidden from assistive tech", () => {
    const { container } = render(<Emphasis variant="scribble" tone="light">shows you</Emphasis>)
    expect(container.firstElementChild).toHaveClass("em-scribble", "em-scribble-light")
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
    expect(container.querySelector("path")).toHaveAttribute("pathLength", "1")
  })

  it("keeps the primary tone class-free", () => {
    render(<Emphasis>plain</Emphasis>)
    expect(screen.getByText("plain").className).toBe("em-mark")
  })
})

describe("WordRotator", () => {
  const words = ["claim", "rumour", "photo"]
  const active = (container: HTMLElement) => container.querySelector("[data-state='in']")?.textContent

  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("reads the first word only to screen readers", () => {
    const { container } = render(<WordRotator words={words} />)
    expect(screen.getByText("claim")).toHaveClass("sr-only")
    for (const item of container.querySelectorAll(".word-rotator-item")) {
      expect(item).toHaveAttribute("aria-hidden", "true")
    }
  })

  it("rotates through the words and marks the outgoing one", () => {
    const { container } = render(<WordRotator words={words} interval={1000} />)
    expect(active(container)).toBe("claim")
    act(() => vi.advanceTimersByTime(1000))
    expect(active(container)).toBe("rumour")
    expect(container.querySelector("[data-state='out']")?.textContent).toBe("claim")
    act(() => vi.advanceTimersByTime(2000))
    expect(active(container)).toBe("claim")
  })

  it("applies the entrance delay only to the first word", () => {
    const { container } = render(<WordRotator words={words} interval={1000} delay={230} />)
    const root = container.firstElementChild as HTMLElement
    expect(root.style.getPropertyValue("--base")).toBe("230ms")
    act(() => vi.advanceTimersByTime(1000))
    expect(root.style.getPropertyValue("--base")).toBe("0ms")
  })

  it("pauses while hovered", () => {
    const { container } = render(<WordRotator words={words} interval={1000} />)
    fireEvent.pointerEnter(container.firstElementChild!)
    act(() => vi.advanceTimersByTime(5000))
    expect(active(container)).toBe("claim")
    fireEvent.pointerLeave(container.firstElementChild!)
    act(() => vi.advanceTimersByTime(1000))
    expect(active(container)).toBe("rumour")
  })

  it("never rotates under prefers-reduced-motion", () => {
    setReducedMotion(true)
    const { container } = render(<WordRotator words={words} interval={1000} />)
    act(() => vi.advanceTimersByTime(10_000))
    expect(active(container)).toBe("claim")
  })

  it("starts again from the first word when the words change", () => {
    const { container, rerender } = render(<WordRotator words={words} interval={1000} />)
    act(() => vi.advanceTimersByTime(1000))
    rerender(<WordRotator words={["ekigambo", "olugambo"]} interval={1000} />)
    expect(active(container)).toBe("ekigambo")
    expect(container.querySelector("[data-state='out']")).toBeNull()
    expect(screen.getByText("ekigambo", { selector: ".sr-only" })).toBeInTheDocument()
  })

  it("adds the marker class when asked", () => {
    const { container } = render(<WordRotator words={words} marker className="em-mark-solid" />)
    expect(container.firstElementChild).toHaveClass("word-rotator", "word-rotator-marker", "em-mark-solid")
  })
})

describe("ScrambleText", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("gives screen readers the real text and keeps every letter's width", () => {
    const { container } = render(<ScrambleText text="Why Zuula" />)
    expect(screen.getByText("Why Zuula")).toHaveClass("sr-only")
    // One ghost per non-space letter holds the real glyph's width.
    expect([...container.querySelectorAll(".scramble-ghost")].map((g) => g.textContent).join("")).toBe("WhyZuula")
  })

  it("decodes on mount, then settles on the real text", () => {
    const { container } = render(<ScrambleText text="Live feed" />)
    act(() => vi.advanceTimersByTime(32))
    expect(container.querySelector("[data-busy]")).not.toBeNull()
    act(() => vi.advanceTimersByTime(2000))
    expect(container.querySelector("[data-busy]")).toBeNull()
    for (const ch of container.querySelectorAll(".scramble-char")) {
      const [ghost, shown] = ch.children
      expect(shown.textContent).toBe(ghost.textContent)
    }
  })

  it("waits until an enclosing [data-reveal] is revealed", async () => {
    const { container } = render(
      <div data-reveal>
        <ScrambleText text="Trending" />
      </div>
    )
    act(() => vi.advanceTimersByTime(100))
    expect(container.querySelector("[data-busy]")).toBeNull()
    await act(async () => {
      container.firstElementChild!.setAttribute("data-revealed", "")
      await Promise.resolve()
    })
    act(() => vi.advanceTimersByTime(32))
    expect(container.querySelector("[data-busy]")).not.toBeNull()
  })

  it("replays on hover", () => {
    const { container } = render(<ScrambleText text="Why" />)
    act(() => vi.advanceTimersByTime(2000))
    fireEvent.pointerEnter(container.firstElementChild!)
    act(() => vi.advanceTimersByTime(32))
    expect(container.querySelector("[data-busy]")).not.toBeNull()
  })

  it("does nothing under prefers-reduced-motion", () => {
    setReducedMotion(true)
    const { container } = render(<ScrambleText text="Why Zuula" />)
    fireEvent.pointerEnter(container.firstElementChild!)
    act(() => vi.advanceTimersByTime(100))
    expect(container.querySelector("[data-busy]")).toBeNull()
  })

  it("shows new text at once when the text changes", () => {
    setReducedMotion(true)
    const { rerender } = render(<ScrambleText text="Why Zuula" />)
    rerender(<ScrambleText text="Lwaki Zuula" />)
    expect(screen.getByText("Lwaki Zuula")).toHaveClass("sr-only")
  })
})
