import { PageHeader } from "@/components/shell/page-header"
import { ReviewOverview } from "@/components/review/review-overview"

export const metadata = { title: "Review overview" }

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Review overview" description="Flagged verdicts, review deadlines and your recent decisions." />
      <ReviewOverview />
    </div>
  )
}
