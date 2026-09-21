"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { RiFireLine, RiSearchLine } from "@remixicon/react"
import { useTranslations } from "next-intl"

import { startNavigationProgress } from "@/components/shell/route-progress"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Kbd } from "@/components/ui/kbd"

// Placeholder trending topics until the search API exists (FR-SEARCH-02).
const TRENDING = ["ebola", "elections", "fuel", "school", "mobileMoney"] as const

const CATEGORIES = ["Health", "Politics", "Elections", "Economy", "Education"] as const

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const t = useTranslations("Search")
  const tcat = useTranslations("Categories")

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  function go(query: string) {
    setOpen(false)
    startNavigationProgress()
    router.push(`/fact-checks?q=${encodeURIComponent(query)}`)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="w-full justify-start text-muted-foreground md:w-56"
        aria-label={t("label")}
      >
        <RiSearchLine aria-hidden />
        <span className="truncate">{t("button")}</span>
        <Kbd className="ml-auto hidden md:inline-flex">{t("shortcut")}</Kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={t("dialogTitle")}
        description={t("dialogDescription")}
      >
        <CommandInput placeholder={t("placeholder")} />
        <CommandList>
          <CommandEmpty>{t("empty")}</CommandEmpty>
          <CommandGroup heading={t("trending")}>
            {TRENDING.map((key) => {
              const topic = t(`topics.${key}`)
              return (
                <CommandItem key={key} value={topic} onSelect={() => go(topic)}>
                  <RiFireLine aria-hidden /> {topic}
                </CommandItem>
              )
            })}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading={t("byCategory")}>
            {CATEGORIES.map((c) => (
              <CommandItem key={c} value={`category ${tcat(c)}`} onSelect={() => go(c)}>
                <RiSearchLine aria-hidden /> {tcat(c)}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
