import "@testing-library/jest-dom/vitest"

import { cleanup } from "@testing-library/react"
import { afterEach, vi } from "vitest"

import { setReducedMotion } from "./media"

afterEach(() => {
  if (typeof document !== "undefined") cleanup()
  setReducedMotion(false)
})

// jsdom has no layout APIs; components that measure (WordRotator) only need them to exist.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub)
