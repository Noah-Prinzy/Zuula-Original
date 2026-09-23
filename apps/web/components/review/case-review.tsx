"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { RiFileList3Line, RiShieldUserLine } from "@remixicon/react"
import { toast } from "sonner"

import { CCSMeter } from "@/components/community/ccs-meter"
import { CommunityStatusBanner } from "@/components/community/community-status"
import { useSession } from "@/components/providers/session-provider"
import { ReasonBadge, SlaBadge } from "@/components/review/review-badges"
import { startNavigationProgress } from "@/components/shell/route-progress"
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
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { AISignalsList } from "@/components/verdict/ai-signals-list"
import { CitationCard } from "@/components/verdict/citation-card"
import { ClaimHighlighter } from "@/components/verdict/claim-highlighter"
import { VerdictBadge } from "@/components/verdict/verdict-badge"
import { VerdictSummary } from "@/components/verdict/verdict-summary"
import { WhatIsTrueCard } from "@/components/verdict/what-is-true-card"
import { communityScore, RATING_WEIGHTS } from "@/lib/community"
import { REASON_META, type ReviewCase } from "@/lib/mock/review"
import { ROLE_LABELS } from "@/lib/roles"
import { VERDICTS, type FactCheckReport, type RaterRole, type Verdict } from "@/lib/types/fact-check"
import { cn } from "@/lib/utils"

const MIN_JUSTIFICATION = 30

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section data-reveal aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="font-heading text-lg font-bold">
        {title}
      </h2>
      {children}
    </section>
  )
}

function CommunitySignals({ report }: { report: FactCheckReport }) {
  const score = communityScore(report.community)
  const roles: RaterRole[] = ["public", "journalist", "expert"]
  return (
    <div className="flex flex-col gap-4 border bg-card p-4">
      <h2 className="font-heading text-sm font-bold">Community signals</h2>
      <CCSMeter score={score} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rater</TableHead>
            <TableHead className="text-right">Accurate</TableHead>
            <TableHead className="text-right">Inaccurate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((r) => (
            <TableRow key={r}>
              <TableCell className="text-xs">
                {ROLE_LABELS[r]} <span className="text-muted-foreground">· {RATING_WEIGHTS[r]}×</span>
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">{report.community.accurate[r]}</TableCell>
              <TableCell className="text-right font-mono tabular-nums">{report.community.inaccurate[r]}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {report.community.comments.length > 0 && (
        <ul className="flex flex-col gap-2 border-t pt-3">
          {report.community.comments.slice(0, 3).map((c) => (
            <li key={c.id} className="text-xs">
              <span className={cn("font-medium", c.vote === "accurate" ? "text-verdict-authentic" : "text-verdict-false")}>
                {c.vote === "accurate" ? "Accurate" : "Inaccurate"}
              </span>{" "}
              · {c.author}: <span className="text-muted-foreground">“{c.body}”</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

type Decision = "confirm" | "override"

// FR-REVIEW-02 to 05: confirm or override the AI verdict with a logged justification.
function DecisionForm({ report, caseId }: { report: FactCheckReport; caseId: string }) {
  const router = useRouter()
  const { user } = useSession()
  const [decision, setDecision] = React.useState<Decision>("confirm")
  const [verdict, setVerdict] = React.useState<Verdict | null>(null)
  const [justification, setJustification] = React.useState("")
  const [note, setNote] = React.useState("")
  const [publishNote, setPublishNote] = React.useState(true)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  const finalVerdict = decision === "confirm" ? report.verdict : verdict

  function validate(e: React.FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (decision === "override" && !verdict) next.verdict = "Choose the correct verdict."
    if (decision === "override" && justification.trim().length < MIN_JUSTIFICATION)
      next.justification = `Explain the override in at least ${MIN_JUSTIFICATION} characters.`
    if (decision === "confirm" && justification.trim().length < 10)
      next.justification = "Add a short reason (at least 10 characters)."
    setErrors(next)
    if (Object.keys(next).length === 0) setConfirmOpen(true)
  }

  function submit() {
    toast.success(decision === "confirm" ? "Verdict confirmed" : "Verdict overridden", {
      description: `${caseId} · logged under ${user?.name ?? "your name"}. The report now shows “Human Verified”.`,
    })
    startNavigationProgress()
    router.push("/review/queue")
  }

  return (
    <form noValidate onSubmit={validate} className="flex flex-col gap-4 border bg-card p-4">
      <h2 className="font-heading text-sm font-bold">Your decision</h2>

      <RadioGroup value={decision} onValueChange={(v) => setDecision(v as Decision)} className="gap-2">
        {(
          [
            { value: "confirm", label: "Confirm the AI verdict", hint: <VerdictBadge verdict={report.verdict} size="sm" /> },
            { value: "override", label: "Override the verdict", hint: <span className="text-xs text-muted-foreground">Choose the correct one</span> },
          ] as const
        ).map((o) => (
          <label
            key={o.value}
            htmlFor={`decision-${o.value}`}
            className="flex cursor-pointer items-center gap-3 border p-3 has-[[data-state=checked]]:border-primary/50 has-[[data-state=checked]]:bg-primary/5"
          >
            <RadioGroupItem id={`decision-${o.value}`} value={o.value} />
            <span className="flex flex-1 flex-col gap-1">
              <span className="text-sm font-medium">{o.label}</span>
              {o.hint}
            </span>
          </label>
        ))}
      </RadioGroup>

      {decision === "override" && (
        <Field data-invalid={!!errors.verdict}>
          <FieldLabel>Correct verdict</FieldLabel>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Correct verdict">
            {VERDICTS.filter((v) => v !== report.verdict).map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={verdict === v}
                onClick={() => setVerdict(v)}
                className={cn(
                  "press border p-1 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  verdict === v ? "border-foreground" : "border-transparent opacity-70 hover:opacity-100"
                )}
              >
                <VerdictBadge verdict={v} size="sm" />
              </button>
            ))}
          </div>
          {errors.verdict && <FieldError>{errors.verdict}</FieldError>}
        </Field>
      )}

      <Field data-invalid={!!errors.justification}>
        <FieldLabel htmlFor="justification">
          Justification {decision === "override" && <span className="text-destructive">(required)</span>}
        </FieldLabel>
        <Textarea
          id="justification"
          rows={4}
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          placeholder="What evidence did you check? Who did you contact?"
          aria-invalid={!!errors.justification}
        />
        <FieldDescription>Internal. Stored in the audit log with your name and the time.</FieldDescription>
        {errors.justification && <FieldError>{errors.justification}</FieldError>}
      </Field>

      <Field>
        <FieldLabel htmlFor="public-note">Note for readers (optional)</FieldLabel>
        <Textarea
          id="public-note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Adds context to the report as an expert note."
        />
        <div className="flex items-center gap-2">
          <Checkbox id="publish-note" checked={publishNote} onCheckedChange={(c) => setPublishNote(c === true)} />
          <label htmlFor="publish-note" className="text-xs text-muted-foreground">
            Show on the public report
          </label>
        </div>
      </Field>

      <div className="flex flex-wrap gap-2">
        <Button type="submit">Submit decision</Button>
        <Button type="button" variant="ghost" asChild>
          <Link href="/review/queue">Back to queue</Link>
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{decision === "confirm" ? "Confirm this verdict?" : "Override this verdict?"}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="flex flex-col gap-3">
                <span className="flex flex-wrap items-center gap-2">
                  <VerdictBadge verdict={report.verdict} size="sm" />
                  {decision === "override" && finalVerdict && (
                    <>
                      <span aria-hidden>→</span>
                      <VerdictBadge verdict={finalVerdict} size="sm" />
                    </>
                  )}
                </span>
                <span>
                  The report gets a Human Verified badge. Your decision counts 5× in the Community Confidence
                  Score and is logged in the audit trail.
                </span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go back</AlertDialogCancel>
            <AlertDialogAction onClick={submit}>Submit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}

export function CaseReview({ reviewCase, report }: { reviewCase: ReviewCase; report: FactCheckReport }) {
  const score = communityScore(report.community)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-mono text-sm">{reviewCase.id}</span>
        <ReasonBadge reason={reviewCase.reason} reports={reviewCase.reports} />
        <SlaBadge flaggedAt={reviewCase.flaggedAt} />
        {reviewCase.priority === "high" && <Badge variant="destructive">High priority</Badge>}
        <span className="text-xs text-muted-foreground">{REASON_META[reviewCase.reason].description}</span>
        <Button variant="outline" size="sm" asChild className="ml-auto">
          <Link href={`/fact-checks/${report.id}`} target="_blank">
            <RiFileList3Line aria-hidden /> Public report
          </Link>
        </Button>
      </div>

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col gap-8">
          <VerdictSummary report={report} headingLevel={2} className="enter [--d:1]" />
          <CommunityStatusBanner status={score.status} className="enter [--d:2]" />
          <Section id="checked" title="What was checked">
            <div className="border bg-card p-4">
              <ClaimHighlighter text={report.submittedText} claims={report.claims} citations={report.citations} />
            </div>
          </Section>
          <Section id="findings" title="AI findings">
            <WhatIsTrueCard whatIsFalse={report.whatIsFalse} whatIsTrue={report.whatIsTrue} />
          </Section>
          {report.aiSignals.length > 0 && (
            <Section id="signals" title="AI detection signals">
              <AISignalsList signals={report.aiSignals} />
            </Section>
          )}
          <Section id="sources" title="Sources">
            <div className="grid gap-2 md:grid-cols-2">
              {report.citations.map((c, i) => (
                <CitationCard key={c.id} citation={c} index={i + 1} />
              ))}
            </div>
          </Section>
        </div>

        <aside className="flex flex-col gap-4 xl:sticky xl:top-20">
          <DecisionForm report={report} caseId={reviewCase.id} />
          <CommunitySignals report={report} />
          <p className="flex gap-2 text-xs text-muted-foreground">
            <RiShieldUserLine className="size-4 shrink-0" aria-hidden />
            Every decision is recorded with reviewer, time and justification (FR-REVIEW-03).
          </p>
        </aside>
      </div>
    </div>
  )
}
