import { PageHeader } from "@/components/shell/page-header"
import { ReviewHistory } from "@/components/review/review-history"

export const metadata = { title: "Review history" }

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Review history" description="Every decision you've made, as recorded in the audit log." />
      <ReviewHistory />
    </div>
  )
}
