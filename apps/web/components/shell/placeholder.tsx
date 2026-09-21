import { RiHammerLine } from "@remixicon/react"
import { useTranslations } from "next-intl"

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
  const t = useTranslations("Common")
  return (
    <div className="flex flex-col gap-6">
      {!hideHeader && <PageHeader title={title} description={description} />}
      <Empty data-reveal="scale" className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RiHammerLine aria-hidden />
          </EmptyMedia>
          <EmptyTitle>{t("screenInProgress")}</EmptyTitle>
          <EmptyDescription>
            {spec ? t("screenInProgressSpec", { spec }) : t("screenInProgressBody")}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )
}
