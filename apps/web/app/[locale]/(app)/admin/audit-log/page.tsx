import { PageHeader } from "@/components/shell/page-header"
import { AuditLog } from "@/components/admin/audit-log"

export const metadata = { title: "Audit Log" }

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Audit Log" description="Every administrative and expert action, with who, when and why." />
      <AuditLog />
    </div>
  )
}
