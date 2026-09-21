import { Placeholder } from "@/components/shell/placeholder"

export const metadata = { title: "Verify" }

export default function Page() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Placeholder title="Verify" description="Submit text, a link or media to check it." spec="FR-SUBMIT" />
    </div>
  )
}
