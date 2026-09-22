import { useTranslations } from "next-intl"

// Translated names for values that arrive as English data (report.category, report.language).
// Unknown values are shown as they are.
export function useContentLabels() {
  const tc = useTranslations("Categories")
  const tl = useTranslations("Languages")
  return {
    category: (value: string) => {
      const key = value as Parameters<typeof tc>[0]
      return tc.has(key) ? tc(key) : value
    },
    language: (value: string) => {
      const key = value as Parameters<typeof tl>[0]
      return tl.has(key) ? tl(key) : value
    },
  }
}
