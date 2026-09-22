import { Suspense } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { PageHero, PageSheet } from "@/components/decor/page-sheet"
import { LibraryBrowser } from "@/components/library/library-browser"
import { Skeleton } from "@/components/ui/skeleton"
import { facets } from "@/lib/library"
import { SAMPLE_REPORTS } from "@/lib/mock/fact-checks"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Library")
  return { title: t("metaTitle"), description: t("metaDescription") }
}

export default async function LibraryPage() {
  const { categories, languages } = facets(SAMPLE_REPORTS)
  const t = await getTranslations("Library")

  return (
    <>
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />
      <PageSheet>
      <div data-reveal className="flex page-container flex-col gap-6 py-10">
        {/* useSearchParams needs a Suspense boundary for static rendering. */}
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <LibraryBrowser
            reports={SAMPLE_REPORTS}
            categories={categories}
            languages={languages}
          />
        </Suspense>
      </div>
      </PageSheet>
    </>
  )
}
