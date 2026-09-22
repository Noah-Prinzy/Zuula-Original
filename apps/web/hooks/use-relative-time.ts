import { useTranslations } from "next-intl"

import { useFormat, type DateInput } from "@/lib/format"
import { MOCK_NOW } from "@/lib/mock/account"

// "just now", "5 min ago", "yesterday"; anything older than a week shows the date.
// Measured from the mock clock until real data arrives, so server and browser agree.
export function useRelativeTime() {
  const t = useTranslations("Common")
  const f = useFormat()
  return (value: DateInput, now: DateInput = MOCK_NOW) => {
    const { count, unit } = f.relative(value, now)
    const n = Math.abs(count)
    if (unit === "minute" && n === 0) return t("justNow")
    if (unit === "minute" || unit === "hour" || unit === "day") return t("ago", { unit, count: n })
    return f.date(value, "dayMonth")
  }
}
