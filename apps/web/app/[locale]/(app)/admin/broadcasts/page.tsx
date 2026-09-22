import { PageHeader } from "@/components/shell/page-header"
import { Broadcasts } from "@/components/admin/broadcasts"

export const metadata = { title: "Broadcasts" }

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Broadcasts" description="Emergency alerts about high-priority misinformation." />
      <Broadcasts />
    </div>
  )
}
