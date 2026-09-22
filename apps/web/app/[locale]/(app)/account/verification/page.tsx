import { PageHeader } from "@/components/shell/page-header"
import { Accreditation } from "@/components/account/accreditation"

export const metadata = { title: "Accreditation" }

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Accreditation" description="Verified Journalists help the community judge verdicts." />
      <Accreditation />
    </div>
  )
}
