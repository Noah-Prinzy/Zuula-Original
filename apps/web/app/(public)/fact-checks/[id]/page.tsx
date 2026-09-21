import { Placeholder } from "@/components/shell/placeholder"

export const metadata = { title: "Report" }

export default function Page() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Placeholder title="Report" description="Verdict, explanation and sources." spec="FR-DETECT, FR-EXPLAIN, FR-RATE" />
    </div>
  )
}
