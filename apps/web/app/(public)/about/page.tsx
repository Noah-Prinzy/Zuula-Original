import { PhotoBanner } from "@/components/decor/photo-hero"
import { PHOTOS } from "@/components/decor/photos"
import { Placeholder } from "@/components/shell/placeholder"

export const metadata = { title: "About" }

export default function Page() {
  return (
    <>
      <PhotoBanner
        photo={PHOTOS.ugandaHills}
        position="center 60%"
        eyebrow="About Zuula"
        title="About"
        description="Our mission, methodology and editorial independence."
      />
      <div className="page-container py-10">
        <Placeholder title="About" spec="" hideHeader />
      </div>
    </>
  )
}
