"use client"

import * as React from "react"
import { RiDownload2Line } from "@remixicon/react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MONTHLY_REPORTS, monthLabel, type MonthlyReport } from "@/lib/mock/admin"

const nf = new Intl.NumberFormat("en-GB")
const config = { checks: { label: "Checks", color: "var(--chart-3)" } } satisfies ChartConfig

function shortMonth(ym: string) {
  return new Date(`${ym}-01T00:00:00`).toLocaleDateString("en-GB", { month: "short" })
}

function download(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function toCsv(rows: MonthlyReport[]) {
  const head = "month,checks,false_or_likely_false_pct,ai_generated,top_categories,avg_delivery_seconds"
  const body = rows.map((r) => [r.month, r.checks, r.falseShare, r.aiGenerated, `"${r.topCategories.join("; ")}"`, r.avgDelivery].join(","))
  return [head, ...body].join("\n")
}

// FR-ADMIN-04: monthly misinformation trend reports.
export function TrendReports() {
  const latest = MONTHLY_REPORTS[MONTHLY_REPORTS.length - 1]
  const previous = MONTHLY_REPORTS[MONTHLY_REPORTS.length - 2]

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="trend-title" className="flex flex-col gap-3 border bg-card p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="trend-title" className="font-heading text-base font-bold">
            Checks per month
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              download("zuula-monthly-trends.csv", toCsv(MONTHLY_REPORTS))
              toast.success("CSV downloaded")
            }}
          >
            <RiDownload2Line aria-hidden /> Export all as CSV
          </Button>
        </div>
        <ChartContainer config={config} className="h-60 w-full">
          <BarChart data={MONTHLY_REPORTS} margin={{ left: 0, right: 0, top: 8 }}>
            <CartesianGrid vertical={false} strokeOpacity={0.5} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={shortMonth} />
            <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={(v) => nf.format(v)} />
            <ChartTooltip cursor={{ fillOpacity: 0.3 }} content={<ChartTooltipContent labelFormatter={(v) => monthLabel(String(v))} />} />
            <Bar dataKey="checks" fill="var(--color-checks)" radius={[2, 2, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ChartContainer>
        <p className="text-xs text-muted-foreground">
          {monthLabel(latest.month)} so far: {nf.format(latest.checks)} checks. {monthLabel(previous.month)}:{" "}
          {nf.format(previous.checks)}.
        </p>
      </section>

      <section aria-labelledby="months-title" className="flex flex-col gap-3">
        <h2 id="months-title" className="font-heading text-lg font-bold">
          Monthly reports
        </h2>
        <div className="overflow-x-auto border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Checks</TableHead>
                <TableHead className="text-right">False or likely false</TableHead>
                <TableHead className="text-right">AI-generated</TableHead>
                <TableHead>Top topics</TableHead>
                <TableHead className="text-right">Avg time</TableHead>
                <TableHead>
                  <span className="sr-only">Export</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...MONTHLY_REPORTS].reverse().map((r) => (
                <TableRow key={r.month}>
                  <TableCell className="font-medium whitespace-nowrap">{monthLabel(r.month)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{nf.format(r.checks)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{r.falseShare}%</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{nf.format(r.aiGenerated)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {r.topCategories.map((c) => (
                        <Badge key={c} variant="outline">{c}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{r.avgDelivery}s</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => {
                        download(`zuula-report-${r.month}.csv`, toCsv([r]))
                        toast.success(`${monthLabel(r.month)} downloaded`)
                      }}
                    >
                      <RiDownload2Line aria-hidden /> CSV
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">
          PDF reports with charts and commentary for partners are generated by the reporting service (Phase 3).
        </p>
      </section>
    </div>
  )
}
