export type Messages = { [key: string]: string | Messages }

// Deep-merges `override` onto `base`; keys absent from `override` keep the base value.
export function deepMerge(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base }
  for (const [key, value] of Object.entries(override)) {
    const current = out[key]
    out[key] =
      typeof value === "object" && typeof current === "object" ? deepMerge(current, value) : value
  }
  return out
}
