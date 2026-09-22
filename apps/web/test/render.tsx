import { render, type RenderOptions } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"

import en from "@/messages/en.json"

// Renders inside the English next-intl provider, as the app does, so components keep working
// in tests as their strings move into messages/*.json.
export function renderWithIntl(ui: React.ReactElement, options?: RenderOptions) {
  return render(ui, {
    wrapper: ({ children }) => (
      <NextIntlClientProvider locale="en" messages={en} timeZone="Africa/Kampala" onError={() => {}}>
        {children}
      </NextIntlClientProvider>
    ),
    ...options,
  })
}
