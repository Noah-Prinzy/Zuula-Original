import { PageHeader } from "@/components/shell/page-header"
import { AlertSettings } from "@/components/account/alert-settings"

export const metadata = { title: "Alerts" }

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Alerts" description="Choose the topics you follow and how alerts reach you." />
      <AlertSettings />
    </div>
  )
}
