import { PageHeader } from "@/components/shell/page-header"
import { TrendReports } from "@/components/admin/trend-reports"

export const metadata = { title: "Reports" }

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reports" description="Monthly misinformation trends in Uganda." />
      <TrendReports />
    </div>
  )
}
