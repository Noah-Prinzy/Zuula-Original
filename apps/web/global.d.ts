import type en from "./messages/en.json"

import type { LocaleCode } from "./lib/locales"

// Type-checks t("…") keys against English; other languages may be partial drafts.
declare module "next-intl" {
  interface AppConfig {
    Locale: LocaleCode
    Messages: typeof en
  }
}
