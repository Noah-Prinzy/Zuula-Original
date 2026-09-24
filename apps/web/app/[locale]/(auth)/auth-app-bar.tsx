"use client"

import { useRouter } from "next/navigation"
import { RiArrowLeftLine } from "@remixicon/react"
import { useTranslations } from "next-intl"

import { Logo } from "@/components/shell/logo"
import { ThemeToggle } from "@/components/shell/theme-toggle"
import { Button } from "@/components/ui/button"
import { canGoBackInApp, useTrackInAppHistory } from "@/hooks/use-in-app-history"
import { usePagePath } from "@/hooks/use-page-path"

// Phones only: the app bar over the auth photo band, in white on its top scrim. Back returns
// to the page that sent people here, or Home when they arrived straight from a link.
// The layout keeps it mounted across auth pages, so it also tracks moves between them.
export function AuthAppBar() {
  const router = useRouter()
  const t = useTranslations("Nav")

  useTrackInAppHistory(usePagePath())

  function back() {
    if (canGoBackInApp()) router.back()
    else router.push("/")
  }

  return (
    <header className="absolute inset-x-0 top-0 z-10 grid grid-cols-[2.75rem_1fr_2.75rem] items-center px-2 pt-[env(safe-area-inset-top)] text-white md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={back}
        aria-label={t("back")}
        className="size-11 text-white hover:bg-white/15 hover:text-white [&_svg:not([class*='size-'])]:size-5"
      >
        <RiArrowLeftLine aria-hidden />
      </Button>
      <Logo className="justify-self-center text-white [&_svg]:size-6" />
      <div className="text-white [&_button]:size-11 [&_button]:text-white [&_button:hover]:bg-white/15">
        <ThemeToggle />
      </div>
    </header>
  )
}
