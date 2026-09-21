import { Placeholder } from "@/components/shell/placeholder"

export const metadata = { title: "Status" }

export default function Page() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Placeholder title="Status" description="Your submission is being analysed." spec="FR-SUBMIT-06" />
    </div>
  )
}
