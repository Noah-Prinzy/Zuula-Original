import { PageHeader } from "@/components/shell/page-header"
import { NotificationsList } from "@/components/account/notifications-list"

export const metadata = { title: "Notifications" }

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Notifications" description="Results of your checks, topic alerts and announcements." />
      <NotificationsList />
    </div>
  )
}
