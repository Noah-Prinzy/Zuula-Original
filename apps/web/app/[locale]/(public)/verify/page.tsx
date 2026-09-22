import {
  RiArticleLine,
  RiFileTextLine,
  RiImageLine,
  RiLink,
  RiLockLine,
  RiWhatsappLine,
} from "@remixicon/react"

import type { Metadata } from "next"
import Image from "next/image"
import { getTranslations } from "next-intl/server"

import { PHOTO_QUALITY, PhotoCredit } from "@/components/decor/photo-hero"
import { PHOTOS } from "@/components/decor/photos"
import { PageHeader } from "@/components/shell/page-header"
import { SubmissionComposer } from "@/components/submission/submission-composer"
import { TrackingLookup } from "@/components/submission/tracking-lookup"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Verify")
  return { title: t("metaTitle"), description: t("metaDescription") }
}

// Text lives in Verify.steps.<key> and Verify.types.<key>.
const STEPS = ["submit", "analyse", "read"] as const

const TYPES = [
  { key: "text", icon: RiFileTextLine },
  { key: "link", icon: RiLink },
  { key: "media", icon: RiImageLine },
  { key: "article", icon: RiArticleLine },
] as const

export default async function VerifyPage() {
  const t = await getTranslations("Verify")
  return (
    <div className="page-container flex flex-col gap-8 py-10">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_26rem]">
        <SubmissionComposer className="enter [--d:2]" />

        <aside data-reveal="stagger" className="flex flex-col gap-6">
          <figure className="relative isolate hidden aspect-[4/3] overflow-hidden border bg-muted lg:block">
            <Image
              src={PHOTOS.marketCall.src}
              alt={PHOTOS.marketCall.alt}
              fill
              quality={PHOTO_QUALITY}
              sizes="(min-width: 1280px) 26rem, 22rem"
              className="-z-10 object-cover object-[center_30%]"
            />
            <figcaption className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-linear-to-t from-black/85 via-black/50 to-transparent p-4 pt-12 text-white">
              <span className="font-heading text-sm font-bold">{t("photoCaption")}</span>
              <PhotoCredit photo={PHOTOS.marketCall} />
            </figcaption>
          </figure>
          <section aria-labelledby="how-it-works" className="hover-lift border bg-card p-4">
            <h2 id="how-it-works" className="mb-3 font-heading text-sm font-bold">
              {t("howTitle")}
            </h2>
            <ol className="flex flex-col gap-3">
              {STEPS.map((s, i) => (
                <li key={s} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center bg-primary font-heading text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{t(`steps.${s}.title`)}</p>
                    <p className="text-sm text-muted-foreground">{t(`steps.${s}.body`)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="what-to-submit" className="hover-lift border bg-card p-4">
            <h2 id="what-to-submit" className="mb-3 font-heading text-sm font-bold">
              {t("whatTitle")}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {TYPES.map((type) => (
                <li key={type.key} className="flex gap-3">
                  <type.icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <div>
                    <p className="text-sm font-medium">{t(`types.${type.key}.title`)}</p>
                    <p className="text-sm text-muted-foreground">{t(`types.${type.key}.body`)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="track-title" className="hover-lift border bg-card p-4">
            <h2 id="track-title" className="mb-3 font-heading text-sm font-bold">
              {t("alreadyTitle")}
            </h2>
            <TrackingLookup />
          </section>

          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p className="flex gap-2">
              <RiWhatsappLine className="mt-0.5 size-4 shrink-0" aria-hidden />
              {t("whatsapp")}
            </p>
            <p className="flex gap-2">
              <RiLockLine className="mt-0.5 size-4 shrink-0" aria-hidden />
              {t("privacy")}
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
