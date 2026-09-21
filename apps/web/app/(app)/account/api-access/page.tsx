import { PageHeader } from "@/components/shell/page-header"
import { ApiKeys } from "@/components/account/api-keys"

export const metadata = { title: "API Keys" }

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="API Keys" description="Check content from your own newsroom tools." />
      <ApiKeys />
    </div>
  )
}
