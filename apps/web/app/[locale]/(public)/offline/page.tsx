import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { PageSheet } from "@/components/decor/page-sheet"
import { PageHeader } from "@/components/shell/page-header"
import { SavedReports } from "@/components/pwa/saved-reports"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Offline")
  return { title: t("metaTitle") }
}

// §7.3 PWA fallback: the service worker (public/sw.js) serves this precached page whenever a
// navigation fails offline, and it lists the reports saved while browsing.
export default async function OfflinePage() {
  const t = await getTranslations("Offline")

  return (
    <PageSheet>
      <PageHeader title={t("title")} description={t("description")} className="page-container pt-8" />
      <div className="page-container max-w-4xl py-10">
        <SavedReports />
      </div>
    </PageSheet>
  )
}
