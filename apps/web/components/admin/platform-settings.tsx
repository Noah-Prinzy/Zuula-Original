"use client"

import * as React from "react"
import { RiRestartLine } from "@remixicon/react"
import { toast } from "sonner"

import { SettingsSection } from "@/components/account/settings-section"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Slider } from "@/components/ui/slider"
import { DEFAULT_SETTINGS, type PlatformSettings } from "@/lib/mock/admin"
import { cn } from "@/lib/utils"

type Thresholds = PlatformSettings["thresholds"]

function NumberField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  suffix,
  hint,
}: {
  id: string
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  suffix?: string
  hint?: string
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
          className="w-24 font-mono"
        />
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
      {hint && <FieldDescription>{hint}</FieldDescription>}
    </Field>
  )
}

function CcsSlider({ id, label, value, onChange, tone }: { id: string; label: string; value: number; onChange: (v: number) => void; tone: string }) {
  return (
    <Field>
      <div className="flex items-baseline justify-between">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <span className={cn("font-mono text-sm tabular-nums", tone)}>{value}%</span>
      </div>
      <Slider id={id} min={0} max={100} step={1} value={[value]} onValueChange={([v]) => onChange(v)} aria-label={label} />
    </Field>
  )
}

function validate(t: Thresholds): string | null {
  if (!(t.suspendedMax < t.escalatedMax)) return "The suspended ceiling must be below the escalation ceiling."
  if (!(t.escalatedMax < t.questionedMin)) return "The escalation ceiling must be below the “questioned” range."
  if (!(t.questionedMin <= t.questionedMax)) return "The “questioned” range is inverted."
  if (!(t.questionedMax < t.verifiedMin)) return "The “questioned” range must end below Community Verified."
  if (!(t.questionedRatings <= t.escalatedRatings && t.escalatedRatings <= t.suspendedRatings))
    return "Minimum ratings should increase: questioned ≤ escalated ≤ suspended."
  return null
}

// FR-ADMIN-06: escalation thresholds, rating weights, SLA and retraining (§9.1–9.3).
export function PlatformSettingsForm() {
  const [s, setS] = React.useState<PlatformSettings>(DEFAULT_SETTINGS)
  const [saved, setSaved] = React.useState<PlatformSettings>(DEFAULT_SETTINGS)
  const [confirm, setConfirm] = React.useState(false)
  const t = s.thresholds
  const setT = (patch: Partial<Thresholds>) => setS({ ...s, thresholds: { ...t, ...patch } })
  const error = validate(t)
  const dirty = JSON.stringify(s) !== JSON.stringify(saved)

  const changes = React.useMemo(() => {
    const out: string[] = []
    const walk = (a: Record<string, unknown>, b: Record<string, unknown>, path: string) => {
      for (const k of Object.keys(a)) {
        const av = a[k]
        const bv = b[k]
        if (typeof av === "object" && av !== null) walk(av as Record<string, unknown>, bv as Record<string, unknown>, `${path}${k}.`)
        else if (av !== bv) out.push(`${path}${k}: ${String(bv)} → ${String(av)}`)
      }
    }
    walk(s as unknown as Record<string, unknown>, saved as unknown as Record<string, unknown>, "")
    return out
  }, [s, saved])

  const footer = (
    <>
      {dirty && <span className="mr-auto text-xs text-muted-foreground">{changes.length} unsaved change{changes.length === 1 ? "" : "s"}</span>}
      <Button variant="ghost" onClick={() => setS(DEFAULT_SETTINGS)} disabled={JSON.stringify(s) === JSON.stringify(DEFAULT_SETTINGS)}>
        <RiRestartLine aria-hidden /> Spec defaults
      </Button>
      <Button onClick={() => setConfirm(true)} disabled={!dirty || !!error}>
        Save settings
      </Button>
    </>
  )

  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <SettingsSection
        id="thresholds"
        title="Escalation thresholds"
        description="When community ratings change a verdict's status (§9.2). Applies to new ratings immediately."
        footer={footer}
        className="xl:row-span-2"
      >
        <CcsSlider id="t-verified" label="Community Verified at or above" value={t.verifiedMin} onChange={(v) => setT({ verifiedMin: v })} tone="text-verdict-authentic" />
        <div className="grid gap-4 border-t pt-4 sm:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-4">
            <CcsSlider id="t-q-min" label="“Questioned” from" value={t.questionedMin} onChange={(v) => setT({ questionedMin: v })} tone="text-verdict-likely-false" />
            <CcsSlider id="t-q-max" label="“Questioned” up to" value={t.questionedMax} onChange={(v) => setT({ questionedMax: v })} tone="text-verdict-likely-false" />
          </div>
          <NumberField id="t-q-r" label="with more than" value={t.questionedRatings} onChange={(v) => setT({ questionedRatings: v })} min={0} max={10000} suffix="ratings" />
        </div>
        <div className="grid gap-4 border-t pt-4 sm:grid-cols-[1fr_auto]">
          <CcsSlider id="t-e-max" label="Send to expert review at or below" value={t.escalatedMax} onChange={(v) => setT({ escalatedMax: v })} tone="text-verdict-false" />
          <NumberField id="t-e-r" label="with more than" value={t.escalatedRatings} onChange={(v) => setT({ escalatedRatings: v })} min={0} max={10000} suffix="ratings" />
        </div>
        <div className="grid gap-4 border-t pt-4 sm:grid-cols-[1fr_auto]">
          <CcsSlider id="t-s-max" label="Suspend the verdict at or below" value={t.suspendedMax} onChange={(v) => setT({ suspendedMax: v })} tone="text-verdict-false" />
          <NumberField id="t-s-r" label="with more than" value={t.suspendedRatings} onChange={(v) => setT({ suspendedRatings: v })} min={0} max={10000} suffix="ratings" />
        </div>
        {error && <FieldError>{error}</FieldError>}
      </SettingsSection>

      <SettingsSection id="weights" title="Rating weights" description="How much each role counts in the Community Confidence Score (§9.1).">
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField id="w-public" label="Public User" value={s.weights.public} onChange={(v) => setS({ ...s, weights: { ...s.weights, public: v } })} min={1} max={10} suffix="×" />
          <NumberField id="w-journalist" label="Verified Journalist" value={s.weights.journalist} onChange={(v) => setS({ ...s, weights: { ...s.weights, journalist: v } })} min={1} max={10} suffix="×" />
          <NumberField id="w-expert" label="Expert Reviewer" value={s.weights.expert} onChange={(v) => setS({ ...s, weights: { ...s.weights, expert: v } })} min={1} max={10} suffix="×" />
        </div>
      </SettingsSection>

      <SettingsSection id="operations" title="Operations" description="Review deadlines, API limits and model retraining (§9.3).">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField id="sla" label="Expert review SLA" value={s.slaHours} onChange={(v) => setS({ ...s, slaHours: v })} min={1} max={168} suffix="hours" hint="Spec: 48 hours." />
          <NumberField id="rate" label="Default API rate limit" value={s.apiRateLimit} onChange={(v) => setS({ ...s, apiRateLimit: v })} min={10} max={10000} suffix="req / hour" hint="Per key. Spec: 100." />
          <Field>
            <FieldLabel htmlFor="retrain">Retraining cadence</FieldLabel>
            <NativeSelect id="retrain" className="w-full" value={s.retraining.cadence} onChange={(e) => setS({ ...s, retraining: { ...s.retraining, cadence: e.target.value as "weekly" | "monthly" } })}>
              <NativeSelectOption value="weekly">Weekly (spec)</NativeSelectOption>
              <NativeSelectOption value="monthly">Monthly</NativeSelectOption>
            </NativeSelect>
          </Field>
          <NumberField id="min-ccs" label="Training data from CCS above" value={s.retraining.minCcs} onChange={(v) => setS({ ...s, retraining: { ...s.retraining, minCcs: v } })} min={50} max={100} suffix="%" hint="Only high-agreement verdicts become training examples. Spec: 85%." />
        </div>
      </SettingsSection>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save {changes.length} change{changes.length === 1 ? "" : "s"}?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="flex flex-col gap-2">
                <span>These apply to the whole platform and are recorded in the audit log.</span>
                <ul className="max-h-48 overflow-y-auto border bg-muted/40 p-2 font-mono text-xs">
                  {changes.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setSaved(s)
                toast.success("Settings saved", { description: "Logged in the audit trail." })
              }}
            >
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
