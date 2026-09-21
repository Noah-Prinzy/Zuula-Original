import { PageHeader } from "@/components/shell/page-header"
import { UserManagement } from "@/components/admin/user-management"

export const metadata = { title: "Users" }

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Users" description="Activate, suspend, approve accreditations and change roles." />
      <UserManagement />
    </div>
  )
}
