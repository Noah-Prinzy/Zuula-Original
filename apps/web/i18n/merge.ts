export type Messages = { [key: string]: string | string[] | Messages }

// Deep-merges `override` onto `base`; keys absent from `override` keep the base value.
// Arrays (e.g. Home.headline.line1Words) are replaced whole, not merged key-by-key —
// otherwise Object.entries would treat them as plain objects and corrupt them.
export function deepMerge(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base }
  for (const [key, value] of Object.entries(override)) {
    const current = out[key]
    out[key] =
      !Array.isArray(value) && !Array.isArray(current) && typeof value === "object" && typeof current === "object"
        ? deepMerge(current, value)
        : value
  }
  return out
}
