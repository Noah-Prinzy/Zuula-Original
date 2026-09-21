import { Placeholder } from "@/components/shell/placeholder"

export const metadata = { title: "Fact-checks · Zuula" }

export default function Page() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Placeholder title="Fact-checks" description="Browse previously verified claims and articles." spec="FR-SEARCH" />
    </div>
  )
}
