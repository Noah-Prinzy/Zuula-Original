import { PageHeader } from "@/components/shell/page-header"
import { ReviewQueue } from "@/components/review/review-queue"

export const metadata = { title: "Review queue" }

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Review queue" description="Verdicts flagged by the community, readers or low AI confidence. Most urgent first." />
      <ReviewQueue />
    </div>
  )
}
