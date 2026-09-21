"use client"

import { RiCheckboxCircleFill, RiErrorWarningFill } from "@remixicon/react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { VerdictBadge } from "@/components/verdict/verdict-badge"
import { DAILY_CHECKS, KPIS, kpiMet, SYSTEM_HEALTH, VERDICT_MIX, type Kpi } from "@/lib/mock/admin"
import { cn } from "@/lib/utils"
import { VERDICT_META } from "@/lib/verdicts"

const nf = new Intl.NumberFormat("en-GB")

function formatKpi(k: Kpi, v = k.value) {
  return `${nf.format(v)}${k.unit}`
}

// §13 KPI: a stat tile, not a chart. Status carries an icon and label, not colour alone.
function KpiTile({ kpi }: { kpi: Kpi }) {
  const met = kpiMet(kpi)
  const Icon = met ? RiCheckboxCircleFill : RiErrorWarningFill
  return (
    <div className="hover-lift flex flex-col gap-1 border bg-card p-4">
      <span className="text-xs text-muted-foreground">{kpi.label}</span>
      <span className="font-heading text-2xl font-bold tabular-nums">{formatKpi(kpi)}</span>
      <span className={cn("inline-flex items-center gap-1 text-xs", met ? "text-verdict-authentic" : "text-verdict-likely-false")}>
        <Icon className="size-3.5" aria-hidden />
        {met ? "On target" : "Below target"} · target {kpi.direction === "min" ? "≥" : "≤"} {formatKpi(kpi, kpi.target)}
      </span>
      <span className="text-[11px] text-muted-foreground">{kpi.note}</span>
    </div>
  )
}

const checksConfig = { checks: { label: "Checks", color: "var(--chart-3)" } } satisfies ChartConfig

function dayLabel(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

function ChecksChart() {
  const total = DAILY_CHECKS.reduce((s, d) => s + d.checks, 0)
  return (
    <section aria-labelledby="checks-title" className="flex flex-col gap-3 border bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="checks-title" className="font-heading text-base font-bold">
          Checks per day
        </h2>
        <span className="text-xs text-muted-foreground">{nf.format(total)} in the last 14 days</span>
      </div>
      <ChartContainer config={checksConfig} className="h-56 w-full">
        <BarChart data={DAILY_CHECKS} margin={{ left: 0, right: 0, top: 8 }}>
          <CartesianGrid vertical={false} strokeOpacity={0.5} />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={dayLabel} minTickGap={16} />
          <YAxis tickLine={false} axisLine={false} width={36} />
          <ChartTooltip cursor={{ fillOpacity: 0.3 }} content={<ChartTooltipContent labelFormatter={(v) => dayLabel(String(v))} />} />
          <Bar dataKey="checks" fill="var(--color-checks)" radius={[2, 2, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ChartContainer>
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Show as table</summary>
        <table className="mt-2 w-full">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="py-1 font-normal">Date</th>
              <th className="py-1 text-right font-normal">Checks</th>
            </tr>
          </thead>
          <tbody>
            {DAILY_CHECKS.map((d) => (
              <tr key={d.date} className="border-t">
                <td className="py-1">{dayLabel(d.date)}</td>
                <td className="py-1 text-right font-mono tabular-nums">{d.checks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  )
}

// Share of verdicts: a labelled bar list (identity from the verdict badge, values in text ink).
function VerdictMix() {
  const total = VERDICT_MIX.reduce((s, v) => s + v.count, 0)
  return (
    <section aria-labelledby="mix-title" className="flex flex-col gap-3 border bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="mix-title" className="font-heading text-base font-bold">
          Verdicts this month
        </h2>
        <span className="text-xs text-muted-foreground">{nf.format(total)} verdicts</span>
      </div>
      <ul className="flex flex-col gap-3">
        {VERDICT_MIX.map((v) => {
          const pct = (v.count / total) * 100
          return (
            <li key={v.verdict} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2 text-sm">
                <VerdictBadge verdict={v.verdict} size="sm" />
                <span className="font-mono text-xs tabular-nums">
                  {nf.format(v.count)} · {pct.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 bg-muted" aria-hidden>
                <div className={cn("h-full", VERDICT_META[v.verdict].solid)} style={{ width: `${pct}%` }} />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function SystemHealth() {
  return (
    <section aria-labelledby="health-title" className="flex flex-col gap-3 border bg-card p-4">
      <h2 id="health-title" className="font-heading text-base font-bold">
        System health
      </h2>
      <ul className="flex flex-col divide-y">
        {SYSTEM_HEALTH.map((h) => {
          const Icon = h.ok ? RiCheckboxCircleFill : RiErrorWarningFill
          return (
            <li key={h.label} className="flex items-center gap-3 py-2">
              <Icon className={cn("size-4 shrink-0", h.ok ? "text-verdict-authentic" : "text-verdict-likely-false")} aria-label={h.ok ? "OK" : "Needs attention"} />
              <span className="flex-1 text-sm">{h.label}</span>
              <span className="flex flex-col items-end">
                <span className="text-sm font-medium tabular-nums">{h.value}</span>
                <span className="text-[11px] text-muted-foreground">{h.note}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function AdminOverview() {
  const met = KPIS.filter(kpiMet).length
  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="kpi-title" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="kpi-title" className="font-heading text-lg font-bold">
            Year-one targets
          </h2>
          <span className="text-sm text-muted-foreground">
            {met} of {KPIS.length} on target
          </span>
        </div>
        <div data-reveal="stagger" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {KPIS.map((k) => (
            <KpiTile key={k.id} kpi={k} />
          ))}
        </div>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <ChecksChart />
        <VerdictMix />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <SystemHealth />
      </div>
    </div>
  )
}
