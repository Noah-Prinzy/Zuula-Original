import { PageHeader } from "@/components/shell/page-header"
import { Moderation } from "@/components/admin/moderation"

export const metadata = { title: "Moderation" }

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Moderation" description="Reported content and suspected rating manipulation." />
      <Moderation />
    </div>
  )
}
