"use client"

import * as React from "react"
import { RiAlarmWarningLine, RiMegaphoneLine, RiSendPlaneLine } from "@remixicon/react"
import { toast } from "sonner"

import { SettingsSection } from "@/components/account/settings-section"
import { NotificationIcon } from "@/components/account/notification-icon"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { SAMPLE_REPORTS } from "@/lib/mock/fact-checks"
import { SAMPLE_BROADCASTS, type Broadcast } from "@/lib/mock/admin"
import { useSession } from "@/components/providers/session-provider"
import { cn } from "@/lib/utils"

const CHANNELS = ["In-app", "Push", "Email", "SMS", "WhatsApp"]
const AUDIENCES = [
  { value: "everyone", label: "Everyone", estimate: 52_000 },
  { value: "central", label: "Central region", estimate: 18_500 },
  { value: "northern", label: "Northern region", estimate: 9_200 },
  { value: "eastern", label: "Eastern region", estimate: 11_400 },
  { value: "western", label: "Western region", estimate: 12_900 },
  { value: "health", label: "Followers of Health", estimate: 14_300 },
  { value: "elections", label: "Followers of Elections", estimate: 10_800 },
]
const MAX_MESSAGE = 320 // fits two SMS segments

const nf = new Intl.NumberFormat("en-GB")

function Composer({ onSent }: { onSent: (b: Broadcast) => void }) {
  const { user } = useSession()
  const [title, setTitle] = React.useState("")
  const [message, setMessage] = React.useState("")
  const [reportId, setReportId] = React.useState("")
  const [severity, setSeverity] = React.useState<"high" | "critical">("high")
  const [audience, setAudience] = React.useState("everyone")
  const [channels, setChannels] = React.useState<string[]>(["In-app", "Push"])
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [confirm, setConfirm] = React.useState(false)

  const aud = AUDIENCES.find((a) => a.value === audience)!

  function review(e: React.FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (title.trim().length < 8) next.title = "Write a clear headline (at least 8 characters)."
    if (message.trim().length < 30) next.message = "Explain what's false and what to do (at least 30 characters)."
    if (channels.length === 0) next.channels = "Choose at least one channel."
    setErrors(next)
    if (Object.keys(next).length === 0) setConfirm(true)
  }

  function send() {
    onSent({
      id: crypto.randomUUID(),
      title: title.trim(),
      message: message.trim(),
      severity,
      audience: aud.label,
      channels,
      sentAt: new Date().toISOString(),
      sentBy: user?.name ?? "Administrator",
      reach: aud.estimate,
      opened: 0,
    })
    toast.success("Broadcast sent", { description: `${nf.format(aud.estimate)} people · ${channels.join(", ")}` })
    setTitle("")
    setMessage("")
    setReportId("")
  }

  return (
    <form noValidate onSubmit={review} className="contents">
      <SettingsSection
        id="compose"
        title="New emergency broadcast"
        description="For high-priority misinformation that is spreading fast. Sent to everyone in the audience, whatever their alert settings."
        footer={
          <Button type="submit">
            <RiSendPlaneLine aria-hidden /> Review and send
          </Button>
        }
      >
        <Field data-invalid={!!errors.title}>
          <FieldLabel htmlFor="bc-title">Headline</FieldLabel>
          <Input id="bc-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={90} placeholder="e.g. Scam alert: fake free-data links" />
          {errors.title && <FieldError>{errors.title}</FieldError>}
        </Field>
        <Field data-invalid={!!errors.message}>
          <FieldLabel htmlFor="bc-message">Message</FieldLabel>
          <Textarea id="bc-message" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={MAX_MESSAGE} placeholder="What's false, what's true, and what people should do." />
          <FieldDescription className="text-right tabular-nums">{message.length}/{MAX_MESSAGE} · fits in two SMS</FieldDescription>
          {errors.message && <FieldError>{errors.message}</FieldError>}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="bc-report">Link to a fact-check (optional)</FieldLabel>
            <NativeSelect id="bc-report" className="w-full" value={reportId} onChange={(e) => setReportId(e.target.value)}>
              <NativeSelectOption value="">None</NativeSelectOption>
              {SAMPLE_REPORTS.slice(0, 8).map((r) => (
                <NativeSelectOption key={r.id} value={r.id}>{r.title.replace(/[“”]/g, "")}</NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor="bc-audience">Audience</FieldLabel>
            <NativeSelect id="bc-audience" className="w-full" value={audience} onChange={(e) => setAudience(e.target.value)}>
              {AUDIENCES.map((a) => (
                <NativeSelectOption key={a.value} value={a.value}>{a.label}</NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldDescription>About {nf.format(aud.estimate)} people.</FieldDescription>
          </Field>
        </div>
        <FieldSet>
          <FieldLegend variant="label">Severity</FieldLegend>
          <RadioGroup value={severity} onValueChange={(v) => setSeverity(v as "high" | "critical")} className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <RadioGroupItem value="high" /> High: notify
            </label>
            <label className="flex items-center gap-2 text-sm">
              <RadioGroupItem value="critical" /> Critical: notify and pin a banner on every page
            </label>
          </RadioGroup>
        </FieldSet>
        <FieldSet data-invalid={!!errors.channels}>
          <FieldLegend variant="label">Channels</FieldLegend>
          <div className="flex flex-wrap gap-4">
            {CHANNELS.map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm">
                <Checkbox checked={channels.includes(c)} onCheckedChange={(on) => setChannels((cs) => (on === true ? [...cs, c] : cs.filter((x) => x !== c)))} />
                {c}
              </label>
            ))}
          </div>
          {errors.channels && <FieldError>{errors.channels}</FieldError>}
        </FieldSet>

        <div className="flex flex-col gap-2 border-t pt-4">
          <span className="text-xs text-muted-foreground">Preview</span>
          <div className={cn("flex gap-3 border p-3", severity === "critical" ? "border-verdict-false/50 bg-verdict-false/5" : "bg-muted/30")}>
            <NotificationIcon kind="broadcast" />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-semibold">{title || "Your headline"}</span>
              <span className="text-sm text-muted-foreground">{message || "Your message appears here."}</span>
            </div>
          </div>
        </div>
      </SettingsSection>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send to {nf.format(aud.estimate)} people?</AlertDialogTitle>
            <AlertDialogDescription>
              {aud.label} · {channels.join(", ")} · {severity === "critical" ? "Critical" : "High"}. Broadcasts can&apos;t be
              recalled once SMS and push messages go out.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go back</AlertDialogCancel>
            <AlertDialogAction onClick={send} className="bg-destructive text-white hover:bg-destructive/90">
              Send broadcast
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}

// FR-ADMIN-05: emergency broadcasts about high-priority misinformation.
export function Broadcasts() {
  const [sent, setSent] = React.useState(SAMPLE_BROADCASTS)
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_28rem]">
      <Composer onSent={(b) => setSent((s) => [b, ...s])} />
      <section data-reveal aria-labelledby="sent-title" className="flex flex-col gap-3 [--d:1]">
        <h2 id="sent-title" className="flex items-center gap-2 font-heading text-lg font-bold">
          <RiMegaphoneLine className="size-5 text-primary" aria-hidden /> Sent broadcasts
        </h2>
        <ul className="flex flex-col divide-y border bg-card">
          {sent.map((b) => (
            <li key={b.id} className="flex flex-col gap-1.5 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={b.severity === "critical" ? "destructive" : "secondary"} className="gap-1">
                  <RiAlarmWarningLine aria-hidden /> {b.severity === "critical" ? "Critical" : "High"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(b.sentAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })} · {b.sentBy}
                </span>
              </div>
              <span className="font-medium">{b.title}</span>
              <span className="text-sm text-muted-foreground">{b.message}</span>
              <span className="text-xs text-muted-foreground">
                {b.audience} · {b.channels.join(", ")} · reached {nf.format(b.reach)}
                {b.opened > 0 && ` · opened ${Math.round((b.opened / b.reach) * 100)}%`}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
