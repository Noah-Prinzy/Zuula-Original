import { useTranslations } from "next-intl"

import { PASSWORD_MIN } from "@/lib/auth"

// Parameters for Validation.* messages that need them.
const PARAMS: Record<string, Record<string, number>> = {
  passwordMin: { min: PASSWORD_MIN },
}

// Zod schemas return Validation.* keys as error messages; this turns them into text in the
// current language. Anything that isn't a known key (e.g. a server error) is shown as is.
export function useValidationMessage() {
  const t = useTranslations("Validation")
  return (message?: string) => {
    if (!message) return undefined
    const key = message as Parameters<typeof t>[0]
    return t.has(key) ? t(key, PARAMS[message]) : message
  }
}
