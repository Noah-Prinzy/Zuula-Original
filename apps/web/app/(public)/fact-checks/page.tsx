import { Suspense } from "react"

import { PhotoBanner } from "@/components/decor/photo-hero"
import { PHOTOS } from "@/components/decor/photos"
import { LibraryBrowser } from "@/components/library/library-browser"
import { Skeleton } from "@/components/ui/skeleton"
import { facets } from "@/lib/library"
import { SAMPLE_REPORTS } from "@/lib/mock/fact-checks"

export const metadata = {
  title: "Library",
  description: "Search claims and articles that Zuula has already checked.",
}

export default function LibraryPage() {
  const { categories, languages } = facets(SAMPLE_REPORTS)

  return (
    <>
      <PhotoBanner
        photo={PHOTOS.newspapers}
        eyebrow="Fact-check library"
        title="Library"
        description="Search claims and articles that have already been checked."
      />
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
    </>
  )
}
