"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  RiArrowRightLine,
  RiCheckboxCircleFill,
  RiFileCopyLine,
  RiLinkM,
  RiNotification3Line,
  RiRefreshLine,
  RiTimeLine,
} from "@remixicon/react"
import { toast } from "sonner"

import { useSession } from "@/components/providers/session-provider"
import { startNavigationProgress } from "@/components/shell/route-progress"
import { AnalysisProgress, type AnalysisState } from "@/components/submission/analysis-progress"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { expectedTime, pipelineFor } from "@/lib/analysis"
import { getSubmission, type StoredSubmission } from "@/lib/mock/submissions"
import { CONTENT_LANGUAGES } from "@/lib/submission"
import { cn } from "@/lib/utils"

const noopSubscribe = () => () => {}
const REDIRECT_SECONDS = 5

// Mock: every finished check opens one of the sample reports.
function reportFor(s: StoredSubmission | null) {
  return s?.type === "media" ? "/fact-checks/fc-2026-0157" : "/fact-checks/fc-2026-0142"
}

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} copied`)
  } catch {
    toast.error("Couldn't copy. Select and copy it manually.")
  }
}

function TrackingIdCard({ trackingId }: { trackingId: string }) {
  return (
    <div className="flex flex-col gap-3 border bg-card p-4">
      <div>
        <p className="text-xs text-muted-foreground">Tracking ID</p>
        <p className="font-mono text-2xl font-bold tracking-wider">{trackingId}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => copy(trackingId, "Tracking ID")}>
          <RiFileCopyLine aria-hidden /> Copy ID
        </Button>
        <Button variant="outline" size="sm" onClick={() => copy(window.location.href, "Link")}>
          <RiLinkM aria-hidden /> Copy link
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Save this ID to come back to your result from any device.
      </p>
    </div>
  )
}

function Tracker({ trackingId, submission }: { trackingId: string; submission: StoredSubmission | null }) {
  const router = useRouter()
  const { user } = useSession()
  const type = submission?.type ?? "text"
  const steps = React.useMemo(() => pipelineFor(type), [type])

  // No local record means the submission was made elsewhere; the API would return its real
  // status. In the mock we treat it as already finished.
  const [current, setCurrent] = React.useState(0)
  const [state, setState] = React.useState<AnalysisState>(submission ? "running" : "done")
  const [elapsed, setElapsed] = React.useState(0)
  const [countdown, setCountdown] = React.useState<number | null>(submission ? REDIRECT_SECONDS : null)
  const [attempt, setAttempt] = React.useState(0)

  // Demo of the failure path: links containing "fail" can't be fetched on the first attempt.
  const failsAt =
    attempt === 0 && submission?.type === "url" && submission.preview.includes("fail")
      ? steps.findIndex((s) => s.id === "fetch")
      : -1

  React.useEffect(() => {
    if (state !== "running") return
    const t = setTimeout(() => {
      if (current === failsAt) setState("error")
      else if (current + 1 >= steps.length) setState("done")
      else setCurrent((c) => c + 1)
    }, steps[current].seconds * 1000)
    return () => clearTimeout(t)
  }, [state, current, steps, failsAt])

  React.useEffect(() => {
    if (state !== "running") return
    const started = Date.now() - elapsed * 1000
    const t = setInterval(() => setElapsed((Date.now() - started) / 1000), 100)
    return () => clearInterval(t)
    // elapsed is read once when the timer (re)starts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  // FR-SUBMIT-06: open the report automatically when the check finishes.
  React.useEffect(() => {
    if (state !== "done" || countdown === null) return
    if (countdown === 0) {
      startNavigationProgress()
      router.push(reportFor(submission))
      return
    }
    const t = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000)
    return () => clearTimeout(t)
  }, [state, countdown, router, submission])

  function retry() {
    setAttempt((a) => a + 1)
    setState("running")
  }

  const language =
    CONTENT_LANGUAGES.find((l) => l.code === submission?.language)?.label ?? "Detect automatically"

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_26rem]">
      <div className="flex flex-col gap-6">
        {state === "done" ? (
          <div className="flex flex-col gap-4 border border-verdict-authentic/40 bg-verdict-authentic/5 p-5">
            <div className="flex items-start gap-3">
              <RiCheckboxCircleFill className="size-7 shrink-0 text-verdict-authentic" aria-hidden />
              <div>
                <h2 className="font-heading text-lg font-bold">Your report is ready</h2>
                <p className="text-sm text-muted-foreground">
                  {countdown !== null
                    ? `Opening it in ${countdown} second${countdown === 1 ? "" : "s"}…`
                    : "See the verdict, the evidence and what the community thinks."}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="lg">
                <Link href={reportFor(submission)}>
                  View report <RiArrowRightLine aria-hidden />
                </Link>
              </Button>
              {countdown !== null && (
                <Button variant="ghost" size="lg" onClick={() => setCountdown(null)}>
                  Stay on this page
                </Button>
              )}
            </div>
          </div>
        ) : state === "error" ? (
          <div role="alert" className="flex flex-col gap-3 border border-destructive/40 bg-destructive/5 p-5">
            <h2 className="font-heading text-lg font-bold">We couldn&apos;t finish this check</h2>
            <p className="text-sm text-muted-foreground">
              The link couldn&apos;t be opened. It may be private, removed or blocking automated
              access. Try again, or paste the article text instead.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={retry}>
                <RiRefreshLine aria-hidden /> Try again
              </Button>
              <Button variant="outline" asChild>
                <Link href="/verify">Paste the text instead</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RiTimeLine className="size-4" aria-hidden />
            <span>
              {elapsed.toFixed(1)}s elapsed · usually takes {expectedTime(type)}
            </span>
          </div>
        )}

        <section aria-labelledby="progress-title" className="border bg-card p-5">
          <h2 id="progress-title" className="sr-only">
            Analysis progress
          </h2>
          <AnalysisProgress
            steps={steps}
            current={current}
            state={state}
            error="Couldn't open the link."
          />
        </section>

        {submission && (
          <section aria-labelledby="submitted-title" className="border bg-card p-5">
            <h2 id="submitted-title" className="mb-2 font-heading text-sm font-bold">
              What you submitted
            </h2>
            <p className={cn("text-sm break-words", submission.type === "url" && "font-mono")}>
              {submission.preview || "—"}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {submission.type === "media" ? "Media file" : submission.type[0].toUpperCase() + submission.type.slice(1)} ·{" "}
              {language} · submitted {new Date(submission.submittedAt).toLocaleTimeString()}
            </p>
          </section>
        )}
      </div>

      <aside className="flex flex-col gap-6">
        <TrackingIdCard trackingId={trackingId} />
        <div className="flex gap-3 border bg-card p-4 text-sm">
          <RiNotification3Line className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          {user ? (
            <p>We&apos;ll notify you when the report is ready, even if you leave this page.</p>
          ) : (
            <p>
              Keep this page open or save your tracking ID.{" "}
              <Link href="/sign-up" className="font-medium text-primary underline-offset-4 hover:underline">
                Create an account
              </Link>{" "}
              to get notified instead.
            </p>
          )}
        </div>
      </aside>
    </div>
  )
}

export function SubmissionStatus({ trackingId }: { trackingId: string }) {
  // sessionStorage is only readable in the browser; render a skeleton until then.
  const mounted = React.useSyncExternalStore(noopSubscribe, () => true, () => false)
  const submission = React.useMemo(
    () => (mounted ? getSubmission(trackingId) : null),
    [mounted, trackingId]
  )

  if (!mounted) return <Skeleton className="h-96 w-full" />
  return <Tracker key={trackingId} trackingId={trackingId} submission={submission} />
}
