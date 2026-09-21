"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { RiCloseLine, RiEqualizerLine, RiSearchLine } from "@remixicon/react"

import { LibraryFilters } from "@/components/library/library-filters"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { FactCheckCard } from "@/components/verdict/fact-check-card"
import {
  activeFilterCount,
  parseQuery,
  searchReports,
  SORTS,
  toSearchParams,
  type LibraryQuery,
  type SortValue,
} from "@/lib/library"
import { VERDICTS, type FactCheckReport, type Verdict } from "@/lib/types/fact-check"
import { formatDate, VERDICT_META } from "@/lib/verdicts"

const CONTENT_LABEL = { text: "Text", url: "Link", image: "Image", audio: "Audio", video: "Video" }

export function LibraryBrowser({
  reports,
  categories,
  languages,
}: {
  reports: FactCheckReport[]
  categories: string[]
  languages: string[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const query = React.useMemo(() => parseQuery(new URLSearchParams(params.toString())), [params])
  const [text, setText] = React.useState(query.q)

  // Keep the box in sync when the URL's q changes elsewhere (header search, back button).
  const [syncedQ, setSyncedQ] = React.useState(query.q)
  if (query.q !== syncedQ) {
    setSyncedQ(query.q)
    if (text.trim() !== query.q) setText(query.q)
  }

  const navigate = React.useCallback(
    (next: LibraryQuery) => {
      const qs = toSearchParams(next).toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname]
  )

  // Any filter change resets to page 1.
  const update = React.useCallback(
    (patch: Partial<LibraryQuery>) => navigate({ ...query, page: 1, ...patch }),
    [navigate, query]
  )

  // Debounced keyword search.
  React.useEffect(() => {
    if (text.trim() === query.q) return
    const t = setTimeout(() => update({ q: text.trim() }), 300)
    return () => clearTimeout(t)
  }, [text, query.q, update])

  const result = React.useMemo(() => searchReports(reports, query), [reports, query])

  // Counts per verdict for the current search, ignoring the verdict filter itself.
  const verdictCounts = React.useMemo(
    () =>
      Object.fromEntries(
        VERDICTS.map((v) => [v, searchReports(reports, { ...query, verdicts: [v], page: 1 }).total])
      ) as Record<Verdict, number>,
    [reports, query]
  )

  const filterCount = activeFilterCount(query)

  const chips: { label: string; clear: () => void }[] = [
    ...query.verdicts.map((v) => ({
      label: VERDICT_META[v].label,
      clear: () => update({ verdicts: query.verdicts.filter((x) => x !== v) }),
    })),
    ...(query.category ? [{ label: query.category, clear: () => update({ category: null }) }] : []),
    ...(query.language ? [{ label: query.language, clear: () => update({ language: null }) }] : []),
    ...(query.type ? [{ label: CONTENT_LABEL[query.type], clear: () => update({ type: null }) }] : []),
    ...(query.from || query.to
      ? [
          {
            label: `${query.from ? formatDate(query.from) : "…"} – ${query.to ? formatDate(query.to) : "…"}`,
            clear: () => update({ from: null, to: null }),
          },
        ]
      : []),
  ]

  function clearAll() {
    setText("")
    navigate({ ...parseQuery(new URLSearchParams()), sort: query.sort })
  }

  function pageHref(page: number) {
    const qs = toSearchParams({ ...query, page }).toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  function goToPage(e: React.MouseEvent, page: number) {
    e.preventDefault()
    navigate({ ...query, page })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const filters = (
    <LibraryFilters
      query={query}
      onChange={update}
      categories={categories}
      languages={languages}
      verdictCounts={verdictCounts}
    />
  )

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,1fr)]">
      <aside aria-label="Filters" className="hidden border bg-card p-4 lg:sticky lg:top-20 lg:block">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-sm font-bold">Filters</h2>
          {filterCount > 0 && (
            <Button variant="link" size="xs" className="px-0" onClick={clearAll}>
              Clear all
            </Button>
          )}
        </div>
        {filters}
      </aside>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <RiSearchLine
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Search claims, topics or sources…"
              aria-label="Search fact-checks"
              className="h-10 pl-9 text-base"
            />
          </div>

          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-10 lg:hidden">
                  <RiEqualizerLine aria-hidden />
                  Filters{filterCount > 0 && ` (${filterCount})`}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>{result.total} results</SheetDescription>
                </SheetHeader>
                <div className="px-4">{filters}</div>
                <SheetFooter>
                  <Button variant="outline" onClick={clearAll} disabled={filterCount === 0}>
                    Clear all
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <label htmlFor="library-sort" className="sr-only">
              Sort by
            </label>
            <NativeSelect
              id="library-sort"
              value={query.sort}
              onChange={(e) => update({ sort: e.target.value as SortValue })}
              className="[&_select]:h-10"
            >
              {SORTS.map((s) => (
                <NativeSelectOption key={s.value} value={s.value}>
                  {s.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <p aria-live="polite" className="text-muted-foreground">
            <span className="font-medium text-foreground">{result.total}</span>{" "}
            {result.total === 1 ? "fact-check" : "fact-checks"}
            {query.q && (
              <>
                {" "}
                for “<span className="text-foreground">{query.q}</span>”
              </>
            )}
          </p>
          {chips.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={c.clear}
              className="inline-flex items-center gap-1 border bg-muted px-2 py-0.5 text-xs hover:border-foreground/30"
              aria-label={`Remove filter ${c.label}`}
            >
              {c.label}
              <RiCloseLine className="size-3" aria-hidden />
            </button>
          ))}
        </div>

        {result.items.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <RiSearchLine aria-hidden />
              </EmptyMedia>
              <EmptyTitle>No fact-checks found</EmptyTitle>
              <EmptyDescription>
                Try different words or remove some filters. If nobody has checked this claim yet,
                you can submit it.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row justify-center">
              <Button variant="outline" onClick={clearAll}>
                Clear search
              </Button>
              <Button asChild>
                <Link href="/verify">Verify a claim</Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {result.items.map((r) => (
              <li key={r.id}>
                <FactCheckCard report={r} />
              </li>
            ))}
          </ul>
        )}

        {result.pageCount > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={pageHref(Math.max(1, result.page - 1))}
                  onClick={(e) => goToPage(e, Math.max(1, result.page - 1))}
                  aria-disabled={result.page === 1}
                  className={result.page === 1 ? "pointer-events-none opacity-50" : undefined}
                />
              </PaginationItem>
              {Array.from({ length: result.pageCount }, (_, i) => i + 1).map((p) => (
                <PaginationItem key={p}>
                  <PaginationLink href={pageHref(p)} isActive={p === result.page} onClick={(e) => goToPage(e, p)}>
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href={pageHref(Math.min(result.pageCount, result.page + 1))}
                  onClick={(e) => goToPage(e, Math.min(result.pageCount, result.page + 1))}
                  aria-disabled={result.page === result.pageCount}
                  className={result.page === result.pageCount ? "pointer-events-none opacity-50" : undefined}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  )
}
