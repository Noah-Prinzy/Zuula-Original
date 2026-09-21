import Link from "next/link"

import { CommunityBadge } from "@/components/community/community-status"
import { PageHeader } from "@/components/shell/page-header"
import { ConfidenceMeter } from "@/components/verdict/confidence-meter"
import { VerdictBadge } from "@/components/verdict/verdict-badge"
import { communityScore } from "@/lib/community"
import { SAMPLE_REPORTS } from "@/lib/mock/fact-checks"
import { formatDate } from "@/lib/verdicts"

export const metadata = { title: "Library" }

// Temporary list of sample reports; search and filters (FR-SEARCH) come later in Phase 1.
export default function LibraryPage() {
  return (
    <div className="page-container flex flex-col gap-6 py-10">
      <PageHeader title="Library" description="Browse previously verified claims and articles." />
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {SAMPLE_REPORTS.map((r) => (
          <li key={r.id}>
            <Link
              href={`/fact-checks/${r.id}`}
              className="flex h-full items-start gap-4 border bg-card p-4 transition-colors hover:border-primary/50"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <VerdictBadge verdict={r.verdict} size="sm" />
                  <CommunityBadge status={communityScore(r.community).status} />
                </div>
                <p className="font-heading font-semibold">{r.title}</p>
                <p className="line-clamp-2 text-sm text-muted-foreground">{r.summary}</p>
                <p className="text-xs text-muted-foreground">
                  {r.category} · {formatDate(r.checkedAt)}
                </p>
              </div>
              <ConfidenceMeter value={r.confidence} verdict={r.verdict} size="sm" showLabel={false} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
