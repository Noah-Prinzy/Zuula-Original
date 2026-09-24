"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { RiSearchLine } from "@remixicon/react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"

// The palette (cmdk + dialog) is a separate chunk, fetched the first time search is opened, or
// ahead of that when the pointer or keyboard focus reaches the button, so it opens instantly
// without every page paying for it up front.
const loadPalette = () => import("@/components/shell/global-search-palette")
const GlobalSearchPalette = dynamic(loadPalette, { ssr: false })

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false)
  // Mount the palette only once it has been wanted, then keep it (for its close animation).
  const [wanted, setWanted] = React.useState(false)
  const t = useTranslations("Search")

  const show = React.useCallback((next: boolean | ((o: boolean) => boolean)) => {
    setWanted(true)
    setOpen(next)
  }, [])

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        show((o) => !o)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [show])

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => show(true)}
        onPointerEnter={() => void loadPalette()}
        onFocus={() => void loadPalette()}
        // An icon in the phone app bar, a search field from md up.
        className="justify-start text-muted-foreground max-md:size-11 max-md:justify-center max-md:border-transparent max-md:bg-transparent max-md:dark:border-transparent max-md:dark:bg-transparent max-md:text-foreground max-md:shadow-none max-md:[&_svg:not([class*='size-'])]:size-5 md:w-36 lg:w-56"
        aria-label={t("label")}
      >
        <RiSearchLine aria-hidden />
        <span className="truncate max-md:hidden">{t("button")}</span>
        <Kbd className="ml-auto hidden lg:inline-flex">{t("shortcut")}</Kbd>
      </Button>
      {wanted && <GlobalSearchPalette open={open} onOpenChange={setOpen} />}
    </>
  )
}
