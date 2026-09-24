import { describe, expect, it } from "vitest"

import en from "@/messages/en.json"

import { GLOBAL_ERROR_TEXT } from "./global-error-text"

// app/global-error.tsx carries a copy of these strings so it doesn't bundle the whole catalogue.
describe("global error text", () => {
  it("matches messages/en.json", () => {
    for (const [key, value] of Object.entries(GLOBAL_ERROR_TEXT)) {
      expect(value).toBe(en.Errors[key as keyof typeof en.Errors])
    }
  })
})
