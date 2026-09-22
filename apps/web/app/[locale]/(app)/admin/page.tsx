import { PageHeader } from "@/components/shell/page-header"
import { AdminOverview } from "@/components/admin/admin-overview"

export const metadata = { title: "Admin overview" }

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Admin overview" description="Year-one targets, platform activity and system health." />
      <AdminOverview />
    </div>
  )
}
