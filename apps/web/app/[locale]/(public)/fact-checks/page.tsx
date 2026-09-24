import { Suspense } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { PageHero, PageSheet } from "@/components/decor/page-sheet"
import { LibraryBrowser, LibraryBrowserFromUrl } from "@/components/library/library-browser"
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
        {/* The fallback is the unfiltered library, so the static HTML has real results
            (not a skeleton) and most visitors see no change when the URL is read. */}
        <Suspense
          fallback={<LibraryBrowser reports={SAMPLE_REPORTS} categories={categories} languages={languages} />}
        >
          <LibraryBrowserFromUrl reports={SAMPLE_REPORTS} categories={categories} languages={languages} />
        </Suspense>
      </div>
      </PageSheet>
    </>
  )
}
