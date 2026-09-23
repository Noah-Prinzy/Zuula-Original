import type { Metadata } from "next"
import { useTranslations } from "next-intl"
import { getTranslations } from "next-intl/server"

import { PageHeader } from "@/components/shell/page-header"
import { ReviewHistory } from "@/components/review/review-history"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages.reviewHistory")
  return { title: t("title") }
}

export default function Page() {
  const t = useTranslations("Pages.reviewHistory")
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <ReviewHistory />
    </div>
  )
}
