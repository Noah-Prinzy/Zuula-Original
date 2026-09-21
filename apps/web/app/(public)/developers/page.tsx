import { PhotoBanner } from "@/components/decor/photo-hero"
import { PHOTOS } from "@/components/decor/photos"
import { Placeholder } from "@/components/shell/placeholder"

export const metadata = { title: "API" }

export default function Page() {
  return (
    <>
      <PhotoBanner
        photo={PHOTOS.crimsonWaves}
        position="center"
        eyebrow="Developers"
        title="API"
        description="Submit content for verification programmatically."
      />
      <div className="page-container py-10">
        <Placeholder title="API" spec="FR-API" hideHeader />
      </div>
    </>
  )
}
