import { PhotoBanner } from "@/components/decor/photo-hero"
import { PHOTOS } from "@/components/decor/photos"
import { Placeholder } from "@/components/shell/placeholder"

export const metadata = { title: "Offline" }

export default function Page() {
  return (
    <>
      <PhotoBanner
        photo={PHOTOS.hillRoad}
        position="center"
        eyebrow="Offline"
        title="You're offline"
        description="Recently viewed reports are still available."
      />
      <div className="page-container py-10">
        <Placeholder title="You're offline" spec="" hideHeader />
      </div>
    </>
  )
}
