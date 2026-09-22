"use client"

import * as React from "react"
import {
  createSortedRowModel,
  flexRender,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  tableFeatures,
  useTable,
  type Column,
  type ColumnDef,
  type RowData,
  type SortingState,
} from "@tanstack/react-table"
import { RiArrowDownSLine, RiArrowUpDownLine, RiArrowUpSLine } from "@remixicon/react"
import { useTranslations } from "next-intl"

import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Shared sortable table for the admin pages (TanStack Table v9).
export const adminTableFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { basic: sortFn_basic, alphanumeric: sortFn_alphanumeric, datetime: sortFn_datetime },
})

export type AdminColumn<T extends RowData> = ColumnDef<typeof adminTableFeatures, T>

export function SortableHeader<T extends RowData>({ column, label }: { column: Column<typeof adminTableFeatures, T, unknown>; label: string }) {
  const dir = column.getIsSorted()
  const Icon = dir === "asc" ? RiArrowUpSLine : dir === "desc" ? RiArrowDownSLine : RiArrowUpDownLine
  return (
    <button type="button" onClick={() => column.toggleSorting()} className="-ml-1 inline-flex items-center gap-1 px-1 hover:text-foreground">
      {label}
      <Icon className="size-3.5" aria-hidden />
    </button>
  )
}

export function DataTable<T extends RowData>({
  data,
  columns,
  initialSorting = [],
  rowClassName,
  emptyTitle,
  emptyDescription,
  getRowId,
}: {
  data: T[]
  columns: AdminColumn<T>[]
  initialSorting?: SortingState
  rowClassName?: (row: T) => string | undefined
  emptyTitle?: string
  emptyDescription?: string
  getRowId?: (row: T) => string
}) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting)
  const t = useTranslations("Admin.table")
  const table = useTable({
    features: adminTableFeatures,
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
  })

  if (data.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>{emptyTitle ?? t("emptyTitle")}</EmptyTitle>
          <EmptyDescription>{emptyDescription ?? t("emptyBody")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="overflow-x-auto border bg-card">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => {
                const s = h.column.getIsSorted()
                return (
                  <TableHead key={h.id} aria-sort={s === "asc" ? "ascending" : s === "desc" ? "descending" : undefined}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className={rowClassName?.(row.original)}>
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
  )
}
