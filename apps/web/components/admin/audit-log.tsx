"use client"

import * as React from "react"
import { RiDownload2Line, RiSearchLine } from "@remixicon/react"
import { toast } from "sonner"

import { DataTable, SortableHeader, type AdminColumn } from "@/components/admin/data-table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { AUDIT_ACTION_LABELS, SAMPLE_AUDIT, type AuditAction, type AuditEntry } from "@/lib/mock/admin"
import { ROLE_LABELS } from "@/lib/roles"
import { initials } from "@/lib/utils"

function exportCsv(rows: AuditEntry[]) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
  const csv = [
    "time,actor,role,action,target,detail,ip",
    ...rows.map((r) => [r.at, esc(r.actor), r.actorRole, r.action, esc(r.target), esc(r.detail), r.ip].join(",")),
  ].join("\n")
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
  const a = document.createElement("a")
  a.href = url
  a.download = "zuula-audit-log.csv"
  a.click()
  URL.revokeObjectURL(url)
}

// FR-ADMIN-07 / FR-REVIEW-03: append-only record of admin and expert actions.
export function AuditLog() {
  const [query, setQuery] = React.useState("")
  const [actor, setActor] = React.useState("")
  const [action, setAction] = React.useState<AuditAction | "">("")

  const actors = [...new Set(SAMPLE_AUDIT.map((a) => a.actor))].sort()
  const q = query.trim().toLowerCase()
  const rows = SAMPLE_AUDIT.filter(
    (e) =>
      (!q || `${e.target} ${e.detail}`.toLowerCase().includes(q)) &&
      (!actor || e.actor === actor) &&
      (!action || e.action === action)
  )

  const columns = React.useMemo<AdminColumn<AuditEntry>[]>(
    () => [
      {
        id: "at",
        accessorFn: (e) => e.at,
        sortFn: "alphanumeric",
        header: ({ column }) => <SortableHeader column={column} label="Time" />,
        meta: { label: "Time" },
        cell: ({ row: { original: e } }) => (
          <time dateTime={e.at} className="font-mono text-xs whitespace-nowrap">
            {new Date(e.at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
          </time>
        ),
      },
      {
        id: "actor",
        header: "Actor",
        cell: ({ row: { original: e } }) => (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Avatar className="size-6">
              <AvatarFallback className="text-[10px]">{initials(e.actor)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm">{e.actor}</span>
              <span className="text-[11px] text-muted-foreground">{ROLE_LABELS[e.actorRole]}</span>
            </div>
          </div>
        ),
      },
      {
        id: "action",
        header: "Action",
        cell: ({ row: { original: e } }) => <Badge variant="outline" className="whitespace-nowrap">{AUDIT_ACTION_LABELS[e.action]}</Badge>,
      },
      {
        id: "target",
        header: "Target and detail",
        cell: ({ row: { original: e } }) => (
          <div className="flex min-w-64 flex-col">
            <span className="text-sm font-medium">{e.target}</span>
            <span className="text-xs text-muted-foreground">{e.detail}</span>
          </div>
        ),
      },
      {
        id: "ip",
        header: "IP",
        cell: ({ row: { original: e } }) => <span className="font-mono text-xs text-muted-foreground">{e.ip}</span>,
      },
    ],
    []
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <RiSearchLine className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search targets and details…" aria-label="Search the audit log" className="pl-9" />
        </div>
        <label htmlFor="audit-actor" className="sr-only">Actor</label>
        <NativeSelect id="audit-actor" value={actor} onChange={(e) => setActor(e.target.value)}>
          <NativeSelectOption value="">Everyone</NativeSelectOption>
          {actors.map((a) => <NativeSelectOption key={a} value={a}>{a}</NativeSelectOption>)}
        </NativeSelect>
        <label htmlFor="audit-action" className="sr-only">Action</label>
        <NativeSelect id="audit-action" value={action} onChange={(e) => setAction(e.target.value as AuditAction | "")}>
          <NativeSelectOption value="">All actions</NativeSelectOption>
          {(Object.keys(AUDIT_ACTION_LABELS) as AuditAction[]).map((a) => (
            <NativeSelectOption key={a} value={a}>{AUDIT_ACTION_LABELS[a]}</NativeSelectOption>
          ))}
        </NativeSelect>
        <Button
          variant="outline"
          onClick={() => {
            exportCsv(rows)
            toast.success(`Exported ${rows.length} entries`)
          }}
        >
          <RiDownload2Line aria-hidden /> Export CSV
        </Button>
      </div>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {rows.length} entries. The log is append-only: entries can&apos;t be edited or deleted, including by administrators.
      </p>
      <DataTable data={rows} columns={columns} getRowId={(e) => e.id} initialSorting={[{ id: "at", desc: true }]} emptyTitle="No entries" />
    </div>
  )
}
