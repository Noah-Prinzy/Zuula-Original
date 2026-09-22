import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"

import { CaseReview } from "@/components/review/case-review"
import { PageHeader } from "@/components/shell/page-header"
import { getCase, SAMPLE_CASES } from "@/lib/mock/review"

type Props = { params: Promise<{ id: string }> }

export function generateStaticParams() {
  return SAMPLE_CASES.map((c) => ({ id: c.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations("Pages.caseReview")
  return { title: t("metaTitle", { id: (await params).id }) }
}

export default async function CasePage({ params }: Props) {
  const found = getCase((await params).id)
  if (!found) notFound()
  const t = await getTranslations("Pages.caseReview")

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <CaseReview reviewCase={found.case} report={found.report} />
    </div>
  )
}
