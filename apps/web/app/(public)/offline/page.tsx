import Link from "next/link"
import { RiHome5Line, RiWifiOffLine } from "@remixicon/react"

import { PhotoBanner } from "@/components/decor/photo-hero"
import { PHOTOS } from "@/components/decor/photos"
import { OfflineRetry } from "@/components/shell/offline-retry"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Button } from "@/components/ui/button"

export const metadata = { title: "Offline" }

// §7.3 PWA fallback: shown by the service worker when a navigation can't reach the network.
export default function OfflinePage() {
  return (
    <>
      <PhotoBanner
        photo={PHOTOS.hillRoad}
        position="center"
        eyebrow="Offline"
        title="You're offline"
        description="Zuula needs a connection to check claims and load new reports."
      />
      <div className="page-container py-10">
        <Empty data-reveal="scale" className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiWifiOffLine aria-hidden />
            </EmptyMedia>
            <EmptyTitle>No connection</EmptyTitle>
            <EmptyDescription>
              Pages you already opened this visit may still load from your browser&apos;s cache.
              Submitting a new claim, tracking live analysis and loading fresh reports all need a
              connection.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <OfflineRetry />
              <Button variant="outline" asChild>
                <Link href="/">
                  <RiHome5Line aria-hidden />
                  Go home
                </Link>
              </Button>
            </div>
          </EmptyContent>
        </Empty>
      </div>
    </>
  )
}
