import { RiHammerLine } from "@remixicon/react"

import { PageHeader } from "@/components/shell/page-header"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

// Temporary body for routes whose screens are built later in Phase 1.
export function Placeholder({
  title,
  description,
  spec,
  hideHeader,
}: {
  title: string
  description?: string
  spec?: string
  /** Set when the page already renders its own title (e.g. a PhotoBanner). */
  hideHeader?: boolean
}) {
  return (
    <div className="flex flex-col gap-6">
      {!hideHeader && <PageHeader title={title} description={description} />}
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RiHammerLine aria-hidden />
          </EmptyMedia>
          <EmptyTitle>Screen in progress</EmptyTitle>
          <EmptyDescription>
            This screen is part of the Phase 1 build{spec ? ` (${spec})` : ""}.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )
}
