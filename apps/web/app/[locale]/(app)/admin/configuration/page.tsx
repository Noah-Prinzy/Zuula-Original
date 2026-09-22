import { PageHeader } from "@/components/shell/page-header"
import { PlatformSettingsForm } from "@/components/admin/platform-settings"

export const metadata = { title: "Settings" }

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" description="Escalation thresholds, rating weights, review SLA and retraining." />
      <PlatformSettingsForm />
    </div>
  )
}
