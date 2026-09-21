import { Placeholder } from "@/components/shell/placeholder"

export const metadata = { title: "Offline" }

export default function Page() {
  return (
    <div className="page-container py-10">
      <Placeholder title="Offline" description="You are offline. Recently viewed reports are still available." spec="" />
    </div>
  )
}
