"use client"

import * as React from "react"
import {
  RiAwardFill,
  RiCheckLine,
  RiFileUploadLine,
  RiScales3Line,
  RiTimeLine,
  RiVerifiedBadgeLine,
} from "@remixicon/react"
import { toast } from "sonner"

import { SettingsSection } from "@/components/account/settings-section"
import { useSession } from "@/components/providers/session-provider"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { identifierKind } from "@/lib/auth"
import { formatBytes, MAX_FILE_BYTES } from "@/lib/submission"
import { cn } from "@/lib/utils"

const BENEFITS = [
  { icon: RiScales3Line, text: "Your ratings count 2× in the Community Confidence Score." },
  { icon: RiVerifiedBadgeLine, text: "A Verified Journalist badge next to your name and comments." },
  { icon: RiAwardFill, text: "API access to check content from your newsroom's tools." },
]

const OUTLETS = ["New Vision", "Daily Monitor", "Nile Post", "ChimpReports", "Uganda Radio Network", "The Observer", "NBS Television", "NTV Uganda"]

type Stage = "form" | "submitted"

function Benefits() {
  return (
    <ul className="flex flex-col gap-3">
      {BENEFITS.map((b) => (
        <li key={b.text} className="flex gap-3 text-sm">
          <b.icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          {b.text}
        </li>
      ))}
    </ul>
  )
}

function Timeline({ submittedAt }: { submittedAt: Date }) {
  const steps = [
    { label: "Application submitted", detail: submittedAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }), done: true },
    { label: "Under review", detail: "An administrator checks your credentials with your media house. Usually 5 working days.", active: true },
    { label: "Decision", detail: "We'll notify you by email and in Zuula." },
  ]
  return (
    <ol className="flex flex-col">
      {steps.map((s, i) => (
        <li key={s.label} className="relative flex gap-3 pb-5 last:pb-0">
          {i < steps.length - 1 && <span className="absolute top-6 bottom-0 left-2.75 w-px bg-border" aria-hidden />}
          <span
            className={cn(
              "relative z-10 flex size-6 shrink-0 items-center justify-center border bg-background",
              s.done && "border-verdict-authentic bg-verdict-authentic text-background",
              s.active && "border-primary text-primary"
            )}
            aria-hidden
          >
            {s.done ? <RiCheckLine className="size-3.5" /> : s.active ? <RiTimeLine className="size-3.5" /> : null}
          </span>
          <div className="flex flex-col">
            <span className={cn("text-sm", s.done || s.active ? "font-medium" : "text-muted-foreground")}>{s.label}</span>
            <span className="text-xs text-muted-foreground">{s.detail}</span>
          </div>
        </li>
      ))}
    </ol>
  )
}

function ApplicationForm({ onSubmitted }: { onSubmitted: () => void }) {
  const { user } = useSession()
  const [outlet, setOutlet] = React.useState("")
  const [title, setTitle] = React.useState("")
  const [workEmail, setWorkEmail] = React.useState("")
  const [membership, setMembership] = React.useState("")
  const [links, setLinks] = React.useState("")
  const [file, setFile] = React.useState<File | null>(null)
  const [declare, setDeclare] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [busy, setBusy] = React.useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (outlet.trim().length < 2) next.outlet = "Enter your media house."
    if (title.trim().length < 2) next.title = "Enter your job title."
    if (identifierKind(workEmail) !== "email") next.workEmail = "Enter your work email address."
    if (!file) next.file = "Upload your press card or letter of employment."
    else if (file.size > MAX_FILE_BYTES) next.file = "Files must be 50 MB or smaller."
    if (!declare) next.declare = "Please confirm the declaration."
    setErrors(next)
    if (Object.keys(next).length) return
    setBusy(true)
    await new Promise((r) => setTimeout(r, 700))
    setBusy(false)
    onSubmitted()
    toast.success("Application submitted", { description: "We'll let you know within 5 working days." })
  }

  return (
    <form noValidate onSubmit={submit} className="contents">
      <SettingsSection
        id="apply"
        title="Apply for Verified Journalist status"
        description={`Applying as ${user?.name ?? "you"}. We verify every application with the media house.`}
        footer={
          <Button type="submit" disabled={busy}>
            {busy ? "Submitting…" : "Submit application"}
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.outlet}>
            <FieldLabel htmlFor="acc-outlet">Media house</FieldLabel>
            <Input id="acc-outlet" list="acc-outlets" value={outlet} onChange={(e) => setOutlet(e.target.value)} aria-invalid={!!errors.outlet} />
            <datalist id="acc-outlets">
              {OUTLETS.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
            {errors.outlet && <FieldError>{errors.outlet}</FieldError>}
          </Field>
          <Field data-invalid={!!errors.title}>
            <FieldLabel htmlFor="acc-title">Job title</FieldLabel>
            <Input id="acc-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Health reporter" aria-invalid={!!errors.title} />
            {errors.title && <FieldError>{errors.title}</FieldError>}
          </Field>
          <Field data-invalid={!!errors.workEmail}>
            <FieldLabel htmlFor="acc-email">Work email</FieldLabel>
            <Input id="acc-email" type="email" value={workEmail} onChange={(e) => setWorkEmail(e.target.value)} placeholder="name@newsroom.co.ug" aria-invalid={!!errors.workEmail} />
            <FieldDescription>We send a confirmation link here.</FieldDescription>
            {errors.workEmail && <FieldError>{errors.workEmail}</FieldError>}
          </Field>
          <Field>
            <FieldLabel htmlFor="acc-membership">UJA membership number (optional)</FieldLabel>
            <Input id="acc-membership" value={membership} onChange={(e) => setMembership(e.target.value)} placeholder="Uganda Journalists Association" />
          </Field>
          <Field data-invalid={!!errors.file} className="sm:col-span-2">
            <FieldLabel htmlFor="acc-file">Press card or letter of employment</FieldLabel>
            <label
              htmlFor="acc-file"
              className={cn(
                "flex cursor-pointer items-center gap-3 border border-dashed p-3 text-sm hover:bg-muted/40 focus-within:ring-2 focus-within:ring-ring",
                errors.file && "border-destructive"
              )}
            >
              <RiFileUploadLine className="size-5 text-muted-foreground" aria-hidden />
              <span className="min-w-0 flex-1 truncate">
                {file ? `${file.name} · ${formatBytes(file.size)}` : "Choose a PDF or photo (up to 50 MB)"}
              </span>
              <input
                id="acc-file"
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                className="sr-only"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {errors.file && <FieldError>{errors.file}</FieldError>}
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="acc-links">Links to your published work (optional)</FieldLabel>
            <Textarea id="acc-links" rows={3} value={links} onChange={(e) => setLinks(e.target.value)} placeholder="One link per line" />
          </Field>
          <Field data-invalid={!!errors.declare} className="sm:col-span-2">
            <div className="flex items-start gap-2">
              <Checkbox id="acc-declare" checked={declare} onCheckedChange={(c) => setDeclare(c === true)} className="mt-0.5" aria-invalid={!!errors.declare} />
              <FieldLabel htmlFor="acc-declare" className="block font-normal leading-snug">
                I confirm these details are true, and I&apos;ll rate verdicts on evidence, not on political or commercial
                interest. Zuula may remove the badge if this is broken.
              </FieldLabel>
            </div>
            {errors.declare && <FieldError>{errors.declare}</FieldError>}
          </Field>
        </div>
      </SettingsSection>
    </form>
  )
}

// FR-AUTH-02 / FR-RATE-06: becoming a Verified Journalist.
export function Accreditation() {
  const { role, user } = useSession()
  const [stage, setStage] = React.useState<Stage>("form")
  const [submittedAt, setSubmittedAt] = React.useState<Date | null>(null)

  if (role === "journalist") {
    return (
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <SettingsSection id="status" title="You're a Verified Journalist">
          <div className="flex items-start gap-3 border border-verdict-authentic/40 bg-verdict-authentic/5 p-4">
            <RiVerifiedBadgeLine className="size-6 shrink-0 text-verdict-authentic" aria-hidden />
            <dl className="grid flex-1 grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Name</dt>
              <dd>{user?.name}</dd>
              <dt className="text-muted-foreground">Media house</dt>
              <dd>Daily Monitor (sample)</dd>
              <dt className="text-muted-foreground">Verified</dt>
              <dd>12 Aug 2026</dd>
              <dt className="text-muted-foreground">Renews</dt>
              <dd>12 Aug 2027</dd>
            </dl>
          </div>
          <p className="text-sm text-muted-foreground">
            Changed newsroom? Update your details and we&apos;ll re-verify them. Your badge stays while we check.
          </p>
          <Button variant="outline" className="w-fit" onClick={() => toast.info("Update requests open with the accounts API")}>
            Update details
          </Button>
        </SettingsSection>
        <SettingsSection id="benefits" title="Your benefits">
          <Benefits />
        </SettingsSection>
      </div>
    )
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      {stage === "form" ? (
        <ApplicationForm
          onSubmitted={() => {
            setSubmittedAt(new Date())
            setStage("submitted")
          }}
        />
      ) : (
        <SettingsSection
          id="application"
          title="Application received"
          footer={
            <Button
              variant="ghost"
              onClick={() => {
                setStage("form")
                toast.info("Application withdrawn")
              }}
            >
              Withdraw application
            </Button>
          }
        >
          {submittedAt && <Timeline submittedAt={submittedAt} />}
        </SettingsSection>
      )}
      <SettingsSection id="benefits" title="Why get verified?" description="For working journalists at recognised Ugandan media houses.">
        <Benefits />
      </SettingsSection>
    </div>
  )
}
