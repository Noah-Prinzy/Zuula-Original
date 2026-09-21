import { Placeholder } from "@/components/shell/placeholder"

export const metadata = { title: "API" }

export default function Page() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Placeholder title="API" description="Submit content for verification programmatically." spec="FR-API" />
    </div>
  )
}
