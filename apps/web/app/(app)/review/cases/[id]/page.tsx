import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CaseReview } from "@/components/review/case-review"
import { PageHeader } from "@/components/shell/page-header"
import { getCase, SAMPLE_CASES } from "@/lib/mock/review"

type Props = { params: Promise<{ id: string }> }

export function generateStaticParams() {
  return SAMPLE_CASES.map((c) => ({ id: c.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Case ${(await params).id}` }
}

export default async function CasePage({ params }: Props) {
  const found = getCase((await params).id)
  if (!found) notFound()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Case review" description="Check the evidence, then confirm or override the verdict." />
      <CaseReview reviewCase={found.case} report={found.report} />
    </div>
  )
}
