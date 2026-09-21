import { Placeholder } from "@/components/shell/placeholder"

export const metadata = { title: "Library" }

export default function Page() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Placeholder title="Library" description="Browse previously verified claims and articles." spec="FR-SEARCH" />
    </div>
  )
}
