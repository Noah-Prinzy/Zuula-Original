import { render, type RenderOptions } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"

import { TooltipProvider } from "@/components/ui/tooltip"
import en from "@/messages/en.json"

// Renders inside the app's client providers (English next-intl, tooltips), as the root
// layout does, so components keep working in tests as their strings move into messages.
export function renderWithIntl(ui: React.ReactElement, options?: RenderOptions) {
  return render(ui, {
    wrapper: ({ children }) => (
      <NextIntlClientProvider locale="en" messages={en} timeZone="Africa/Kampala" onError={() => {}}>
        <TooltipProvider>{children}</TooltipProvider>
      </NextIntlClientProvider>
    ),
    ...options,
  })
}
