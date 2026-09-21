import { PageHeader } from "@/components/shell/page-header"
import { ActivityList } from "@/components/account/activity-list"

export const metadata = { title: "Activity" }

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Activity" description="Everything you've submitted and rated." />
      <ActivityList />
    </div>
  )
}
