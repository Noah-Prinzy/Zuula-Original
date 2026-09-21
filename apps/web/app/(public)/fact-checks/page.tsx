import { Suspense } from "react"

import { LibraryBrowser } from "@/components/library/library-browser"
import { PageHeader } from "@/components/shell/page-header"
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
    <div className="page-container flex flex-col gap-6 py-10">
      <PageHeader
        title="Library"
        description="Search claims and articles that have already been checked."
      />
      {/* useSearchParams needs a Suspense boundary for static rendering. */}
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <LibraryBrowser reports={SAMPLE_REPORTS} categories={categories} languages={languages} />
      </Suspense>
    </div>
  )
}
