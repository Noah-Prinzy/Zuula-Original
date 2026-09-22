import { PageHeader } from "@/components/shell/page-header"
import { ProfileSettings } from "@/components/account/profile-settings"

export const metadata = { title: "Profile" }

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Profile" description="Your details, security and personal data." />
      <ProfileSettings />
    </div>
  )
}
