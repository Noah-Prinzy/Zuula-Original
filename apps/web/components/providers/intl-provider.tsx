"use client"

import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl"

import { TIME_ZONE } from "@/i18n/config"
import type { LocaleCode } from "@/lib/locales"

// Client side of next-intl. Functions can't cross from the root layout (a server component),
// so the missing-key handling that i18n/request.ts applies on the server is repeated here.
export function IntlProvider({
  locale,
  messages,
  children,
}: {
  locale: LocaleCode
  messages: AbstractIntlMessages
  children: React.ReactNode
}) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={TIME_ZONE}
      onError={(error) => {
        if (process.env.NODE_ENV !== "production") console.warn(`[i18n] ${error.message}`)
      }}
      getMessageFallback={({ namespace, key }) => (namespace ? `${namespace}.${key}` : key)}
    >
      {children}
    </NextIntlClientProvider>
  )
}
