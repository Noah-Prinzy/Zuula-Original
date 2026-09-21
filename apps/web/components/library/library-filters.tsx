"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { VerdictBadge } from "@/components/verdict/verdict-badge"
import type { LibraryQuery } from "@/lib/library"
import { VERDICTS, type ContentType, type Verdict } from "@/lib/types/fact-check"

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "url", label: "Link" },
  { value: "image", label: "Image" },
  { value: "audio", label: "Audio" },
  { value: "video", label: "Video" },
]

// FR-SEARCH-01: verdict, category, language, content type and date range.
export function LibraryFilters({
  query,
  onChange,
  categories,
  languages,
  verdictCounts,
}: {
  query: LibraryQuery
  onChange: (patch: Partial<LibraryQuery>) => void
  categories: string[]
  languages: string[]
  verdictCounts: Record<Verdict, number>
}) {
  function toggleVerdict(v: Verdict, on: boolean) {
    const next = on ? [...query.verdicts, v] : query.verdicts.filter((x) => x !== v)
    onChange({ verdicts: VERDICTS.filter((x) => next.includes(x)) })
  }

  return (
    <div className="flex flex-col gap-6">
      <FieldSet>
        <FieldLegend variant="label">Verdict</FieldLegend>
        <div className="flex flex-col gap-2">
          {VERDICTS.map((v) => {
            const id = `filter-verdict-${v}`
            return (
              <div key={v} className="flex items-center gap-2">
                <Checkbox
                  id={id}
                  checked={query.verdicts.includes(v)}
                  onCheckedChange={(c) => toggleVerdict(v, c === true)}
                />
                <label htmlFor={id} className="flex flex-1 cursor-pointer items-center justify-between gap-2">
                  <VerdictBadge verdict={v} size="sm" />
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">
                    {verdictCounts[v]}
                  </span>
                </label>
              </div>
            )
          })}
        </div>
      </FieldSet>

      <Field>
        <FieldLabel htmlFor="filter-category">Category</FieldLabel>
        <NativeSelect
          id="filter-category"
          className="w-full"
          value={query.category ?? ""}
          onChange={(e) => onChange({ category: e.target.value || null })}
        >
          <NativeSelectOption value="">All categories</NativeSelectOption>
          {categories.map((c) => (
            <NativeSelectOption key={c} value={c}>
              {c}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <Field>
        <FieldLabel htmlFor="filter-language">Language</FieldLabel>
        <NativeSelect
          id="filter-language"
          className="w-full"
          value={query.language ?? ""}
          onChange={(e) => onChange({ language: e.target.value || null })}
        >
          <NativeSelectOption value="">All languages</NativeSelectOption>
          {languages.map((l) => (
            <NativeSelectOption key={l} value={l}>
              {l}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <Field>
        <FieldLabel htmlFor="filter-type">Content type</FieldLabel>
        <NativeSelect
          id="filter-type"
          className="w-full"
          value={query.type ?? ""}
          onChange={(e) => onChange({ type: (e.target.value || null) as ContentType | null })}
        >
          <NativeSelectOption value="">All types</NativeSelectOption>
          {CONTENT_TYPES.map((t) => (
            <NativeSelectOption key={t.value} value={t.value}>
              {t.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <FieldSet>
        <FieldLegend variant="label">Date checked</FieldLegend>
        <div className="grid grid-cols-2 gap-2">
          <Field>
            <FieldLabel htmlFor="filter-from" className="text-xs font-normal text-muted-foreground">
              From
            </FieldLabel>
            <Input
              id="filter-from"
              type="date"
              value={query.from ?? ""}
              max={query.to ?? undefined}
              onChange={(e) => onChange({ from: e.target.value || null })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="filter-to" className="text-xs font-normal text-muted-foreground">
              To
            </FieldLabel>
            <Input
              id="filter-to"
              type="date"
              value={query.to ?? ""}
              min={query.from ?? undefined}
              onChange={(e) => onChange({ to: e.target.value || null })}
            />
          </Field>
        </div>
      </FieldSet>
    </div>
  )
}
