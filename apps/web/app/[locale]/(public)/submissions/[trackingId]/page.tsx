import type { Metadata } from "next"
import { RiQuestionLine } from "@remixicon/react"
import { getTranslations } from "next-intl/server"

import { PageSheet } from "@/components/decor/page-sheet"
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
  const t = await getTranslations("Status")
  return {
    title: t("metaTitle", { id }),
    // Tracking links are private to the submitter.
    robots: { index: false, follow: false },
  }
}

export default async function StatusPage({ params }: Props) {
  const id = normaliseTrackingId(decodeURIComponent((await params).trackingId))
  const valid = TRACKING_ID_PATTERN.test(id)
  const t = await getTranslations("Status")

  return (
    <PageSheet>
      <PageHeader
        title={t("title")}
        description={valid ? t("descriptionValid") : t("descriptionInvalid")}
        className="page-container pt-8"
      />
      <div className="page-container flex flex-col gap-8 py-10">
        {valid ? (
          <SubmissionStatus trackingId={id} />
        ) : (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <RiQuestionLine aria-hidden />
              </EmptyMedia>
              <EmptyTitle>{t("notFoundTitle")}</EmptyTitle>
              <EmptyDescription>{t("notFoundBody")}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="max-w-sm">
              <TrackingLookup className="w-full text-left" />
            </EmptyContent>
          </Empty>
        )}
      </div>
    </PageSheet>
  )
}
