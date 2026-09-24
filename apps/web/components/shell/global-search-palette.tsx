"use client"

import { useRouter } from "next/navigation"
import { RiFireLine, RiSearchLine } from "@remixicon/react"
import { useTranslations } from "next-intl"

import { startNavigationProgress } from "@/components/shell/route-progress"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

// Placeholder trending topics until the search API exists (FR-SEARCH-02).
const TRENDING = [
  "ebola",
  "elections",
  "fuel",
  "school",
  "mobileMoney",
] as const

const CATEGORIES = [
  "Health",
  "Politics",
  "Elections",
  "Economy",
  "Education",
] as const

// The search palette itself (cmdk + dialog). Loaded on demand by GlobalSearch, so pages don't
// ship it until someone opens search.
export default function GlobalSearchPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const t = useTranslations("Search")
  const tcat = useTranslations("Categories")

  function go(query: string) {
    onOpenChange(false)
    startNavigationProgress()
    router.push(`/fact-checks?q=${encodeURIComponent(query)}`)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("dialogTitle")}
      description={t("dialogDescription")}
    >
      {/* CommandDialog is only the dialog; the cmdk root (and its store) is ours to add. */}
      <Command>
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
              <CommandItem
                key={c}
                value={`category ${tcat(c)}`}
                onSelect={() => go(c)}
              >
                <RiSearchLine aria-hidden /> {tcat(c)}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
