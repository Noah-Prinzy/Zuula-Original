import type { Metadata } from "next"
import { RiQuestionLine } from "@remixicon/react"

import { PageHeader } from "@/components/shell/page-header"
import { SubmissionStatus } from "@/components/submission/submission-status"
import { TrackingLookup } from "@/components/submission/tracking-lookup"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { normaliseTrackingId, TRACKING_ID_PATTERN } from "@/lib/analysis"

type Props = { params: Promise<{ trackingId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = normaliseTrackingId(decodeURIComponent((await params).trackingId))
  return {
    title: `Status ${id}`,
    // Tracking links are private to the submitter.
    robots: { index: false, follow: false },
  }
}

export default async function StatusPage({ params }: Props) {
  const id = normaliseTrackingId(decodeURIComponent((await params).trackingId))
  const valid = TRACKING_ID_PATTERN.test(id)

  return (
    <div className="page-container flex flex-col gap-8 py-10">
      <PageHeader
        title="Status"
        description={valid ? "Follow your check as it runs." : "Track a submission by its ID."}
      />

      {valid ? (
        <SubmissionStatus trackingId={id} />
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiQuestionLine aria-hidden />
            </EmptyMedia>
            <EmptyTitle>We couldn&apos;t find that tracking ID</EmptyTitle>
            <EmptyDescription>Check the ID and try again. Tracking IDs look like ZL-7K3P-Q9.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="max-w-sm">
            <TrackingLookup className="w-full text-left" />
          </EmptyContent>
        </Empty>
      )}
    </div>
  )
}
