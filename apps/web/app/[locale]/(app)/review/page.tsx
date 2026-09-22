import type { Metadata } from "next"
import { useTranslations } from "next-intl"
import { getTranslations } from "next-intl/server"

import { PageHeader } from "@/components/shell/page-header"
import { ReviewOverview } from "@/components/review/review-overview"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages.reviewOverview")
  return { title: t("title") }
}

export default function Page() {
  const t = useTranslations("Pages.reviewOverview")
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <ReviewOverview />
    </div>
  )
}
