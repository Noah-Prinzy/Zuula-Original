import { PageHeader } from "@/components/shell/page-header"
import { SourceManager } from "@/components/admin/source-manager"

export const metadata = { title: "Sources" }

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Sources" description="The trusted sources claims are cross-referenced against." />
      <SourceManager />
    </div>
  )
}
