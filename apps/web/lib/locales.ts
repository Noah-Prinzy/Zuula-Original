// Supported languages (FR-SUBMIT-03). UI translations are wired up with next-intl later.
export const LOCALES = [
  { code: "en", label: "English", native: "English" },
  { code: "lg", label: "Luganda", native: "Luganda" },
  { code: "ach", label: "Acholi", native: "Lëb Acoli" },
  { code: "nyn", label: "Runyankole", native: "Runyankore" },
  { code: "teo", label: "Ateso", native: "Ateso" },
] as const

export type LocaleCode = (typeof LOCALES)[number]["code"]

export const DEFAULT_LOCALE: LocaleCode = "en"
