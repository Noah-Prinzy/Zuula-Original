import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { PhotoBanner } from "@/components/decor/photo-hero"
import { PHOTOS } from "@/components/decor/photos"
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
    <>
      <PhotoBanner
        photo={PHOTOS.hillRoad}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />
      <div className="page-container max-w-4xl py-10">
        <SavedReports />
      </div>
    </>
  )
}
