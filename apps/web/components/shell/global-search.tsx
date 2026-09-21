"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { RiFireLine, RiSearchLine } from "@remixicon/react"

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
const TRENDING = [
  "Ebola treatment claims",
  "2026 election results",
  "Fuel price increase",
  "School calendar changes",
  "Mobile money tax",
]

const CATEGORIES = ["Health", "Politics", "Elections", "Economy", "Education"]

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

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
    router.push(`/search?q=${encodeURIComponent(query)}`)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="w-full justify-start text-muted-foreground md:w-56"
        aria-label="Search fact-checks"
      >
        <RiSearchLine aria-hidden />
        <span className="truncate">Search fact-checks…</span>
        <Kbd className="ml-auto hidden md:inline-flex">Ctrl K</Kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search fact-checks"
        description="Search previously verified claims and articles"
      >
        <CommandInput placeholder="Search claims, topics, sources…" />
        <CommandList>
          <CommandEmpty>No matches. Press Enter to search all fact-checks.</CommandEmpty>
          <CommandGroup heading="Trending misinformation">
            {TRENDING.map((t) => (
              <CommandItem key={t} value={t} onSelect={() => go(t)}>
                <RiFireLine aria-hidden /> {t}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Browse by category">
            {CATEGORIES.map((c) => (
              <CommandItem key={c} value={`category ${c}`} onSelect={() => go(c)}>
                <RiSearchLine aria-hidden /> {c}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
