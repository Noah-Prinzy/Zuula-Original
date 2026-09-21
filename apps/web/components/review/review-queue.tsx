"use client"

import * as React from "react"
import Link from "next/link"
import {
  createSortedRowModel,
  flexRender,
  rowSortingFeature,
  sortFn_basic,
  tableFeatures,
  useTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { RiArrowDownSLine, RiArrowUpDownLine, RiArrowUpSLine, RiSearchLine, RiUserAddLine } from "@remixicon/react"
import { toast } from "sonner"

import { CommunityBadge } from "@/components/community/community-status"
import { useSession } from "@/components/providers/session-provider"
import { ReasonBadge, SlaBadge } from "@/components/review/review-badges"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { VerdictBadge } from "@/components/verdict/verdict-badge"
import { communityScore } from "@/lib/community"
import { getSampleReport } from "@/lib/mock/fact-checks"
import { REASON_META, SAMPLE_CASES, slaFor, type ReviewCase, type ReviewReason } from "@/lib/mock/review"
import type { FactCheckReport } from "@/lib/types/fact-check"

type Row = ReviewCase & { report: FactCheckReport; ccs: number | null; ratings: number; hoursLeft: number }

type Scope = "all" | "mine" | "unassigned"

// TanStack Table v9: features and row models are declared once, outside the component.
const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { basic: sortFn_basic },
})

function SortHeader({ label, dir, onClick }: { label: string; dir: false | "asc" | "desc"; onClick: () => void }) {
  const Icon = dir === "asc" ? RiArrowUpSLine : dir === "desc" ? RiArrowDownSLine : RiArrowUpDownLine
  return (
    <button type="button" onClick={onClick} className="-ml-1 inline-flex items-center gap-1 px-1 hover:text-foreground">
      {label}
      <Icon className="size-3.5" aria-hidden />
    </button>
  )
}

// FR-REVIEW-01 / 06: flagged verdicts awaiting expert review, most urgent first.
export function ReviewQueue() {
  const { user } = useSession()
  const [cases, setCases] = React.useState(SAMPLE_CASES)
  const [query, setQuery] = React.useState("")
  const [reason, setReason] = React.useState<ReviewReason | "">("")
  const [scope, setScope] = React.useState<Scope>("all")
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "sla", desc: false }])

  const assign = React.useCallback(
    (id: string) => {
      if (!user) return
      setCases((cs) => cs.map((c) => (c.id === id ? { ...c, assignee: user.name } : c)))
      toast.success("Assigned to you")
    },
    [user]
  )

  const rows = React.useMemo<Row[]>(() => {
    const q = query.trim().toLowerCase()
    return cases
      .map((c) => {
        const report = getSampleReport(c.reportId)!
        const score = communityScore(report.community)
        return { ...c, report, ccs: score.ccs, ratings: score.total, hoursLeft: slaFor(c.flaggedAt).hoursLeft }
      })
      .filter((r) => !q || `${r.report.title} ${r.id} ${r.report.category}`.toLowerCase().includes(q))
      .filter((r) => !reason || r.reason === reason)
      .filter((r) => scope === "all" || (scope === "mine" ? r.assignee === user?.name : r.assignee === null))
  }, [cases, query, reason, scope, user])

  const columns = React.useMemo<ColumnDef<typeof features, Row>[]>(
    () => [
      {
        id: "content",
        header: "Content",
        cell: ({ row: { original: r } }) => (
          <div className="flex min-w-64 flex-col gap-1">
            <Link href={`/review/cases/${r.id}`} className="font-medium hover:text-primary">
              {r.report.title}
            </Link>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-mono text-xs text-muted-foreground">{r.id}</span>
              <ReasonBadge reason={r.reason} reports={r.reports} />
              {r.priority === "high" && <Badge variant="destructive">High priority</Badge>}
            </div>
          </div>
        ),
      },
      {
        id: "verdict",
        header: "AI verdict",
        cell: ({ row: { original: r } }) => <VerdictBadge verdict={r.report.verdict} size="sm" />,
      },
      {
        id: "ccs",
        accessorFn: (r) => r.ccs ?? -1,
        sortFn: "basic",
        header: ({ column }) => (
          <SortHeader label="CCS" dir={column.getIsSorted()} onClick={() => column.toggleSorting()} />
        ),
        cell: ({ row: { original: r } }) => (
          <div className="flex flex-col gap-1">
            <span className="font-mono tabular-nums">{r.ccs === null ? "—" : `${r.ccs}%`}</span>
            <span className="text-xs text-muted-foreground">{r.ratings} ratings</span>
            <CommunityBadge status={communityScore(r.report.community).status} />
          </div>
        ),
      },
      {
        id: "sla",
        accessorFn: (r) => r.hoursLeft,
        sortFn: "basic",
        header: ({ column }) => (
          <SortHeader label="SLA" dir={column.getIsSorted()} onClick={() => column.toggleSorting()} />
        ),
        cell: ({ row: { original: r } }) => <SlaBadge flaggedAt={r.flaggedAt} />,
      },
      {
        id: "assignee",
        header: "Assignee",
        cell: ({ row: { original: r } }) =>
          r.assignee ? (
            <span className="text-sm whitespace-nowrap">{r.assignee === user?.name ? "You" : r.assignee}</span>
          ) : (
            <Button variant="ghost" size="xs" onClick={() => assign(r.id)}>
              <RiUserAddLine aria-hidden /> Assign to me
            </Button>
          ),
      },
      {
        id: "action",
        header: () => <span className="sr-only">Action</span>,
        cell: ({ row: { original: r } }) => (
          <Button size="sm" asChild>
            <Link href={`/review/cases/${r.id}`}>Review</Link>
          </Button>
        ),
      },
    ],
    [assign, user]
  )

  const table = useTable({
    features,
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <RiSearchLine className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, case ID or category…"
            aria-label="Search the queue"
            className="pl-9"
          />
        </div>
        <label htmlFor="queue-reason" className="sr-only">
          Reason
        </label>
        <NativeSelect id="queue-reason" value={reason} onChange={(e) => setReason(e.target.value as ReviewReason | "")}>
          <NativeSelectOption value="">All reasons</NativeSelectOption>
          {(Object.keys(REASON_META) as ReviewReason[]).map((r) => (
            <NativeSelectOption key={r} value={r}>
              {REASON_META[r].label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={scope}
          onValueChange={(v) => v && setScope(v as Scope)}
          aria-label="Assignment"
        >
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="mine">Mine</ToggleGroupItem>
          <ToggleGroupItem value="unassigned">Unassigned</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {rows.length} {rows.length === 1 ? "case" : "cases"} · sorted by{" "}
        {sorting[0]?.id === "ccs" ? "community score" : "time left"}
      </p>

      {rows.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Nothing to review</EmptyTitle>
            <EmptyDescription>No cases match these filters.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-x-auto border bg-card">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead key={h.id} aria-sort={h.column.getIsSorted() === "asc" ? "ascending" : h.column.getIsSorted() === "desc" ? "descending" : undefined}>
                      {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className={row.original.hoursLeft < 0 ? "bg-verdict-false/[0.04]" : undefined}>
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id} className="align-top">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
