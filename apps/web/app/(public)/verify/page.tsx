import {
  RiArticleLine,
  RiFileTextLine,
  RiImageLine,
  RiLink,
  RiLockLine,
  RiWhatsappLine,
} from "@remixicon/react"

import Image from "next/image"

import { PHOTO_QUALITY, PhotoCredit } from "@/components/decor/photo-hero"
import { PHOTOS } from "@/components/decor/photos"
import { PageHeader } from "@/components/shell/page-header"
import { SubmissionComposer } from "@/components/submission/submission-composer"
import { TrackingLookup } from "@/components/submission/tracking-lookup"

export const metadata = {
  title: "Verify",
  description: "Check a message, link, image, audio or video for misinformation.",
}

const STEPS = [
  { title: "Submit", body: "Paste text, share a link or upload media. You get a tracking ID." },
  { title: "We analyse", body: "Claims are cross-checked against trusted sources and AI-detection models. Text takes about 10 seconds, media up to a minute." },
  { title: "Read the report", body: "See the verdict, the evidence, and what the community thinks." },
]

const TYPES = [
  { icon: RiFileTextLine, title: "Text", body: "WhatsApp forwards, social posts, quotes" },
  { icon: RiLink, title: "Link", body: "News articles and web pages" },
  { icon: RiImageLine, title: "Media", body: "Photos, voice notes and videos up to 50 MB" },
  { icon: RiArticleLine, title: "Article", body: "Full article text you've copied" },
]

export default function VerifyPage() {
  return (
    <div className="page-container flex flex-col gap-8 py-10">
      <PageHeader
        title="Verify"
        description="Check a message, link, image, audio or video before you share it."
      />

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_26rem]">
        <SubmissionComposer />

        <aside className="flex flex-col gap-6">
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
              <span className="font-heading text-sm font-bold">Heard it on WhatsApp? Check it here.</span>
              <PhotoCredit photo={PHOTOS.marketCall} />
            </figcaption>
          </figure>
          <section aria-labelledby="how-it-works" className="border bg-card p-4">
            <h2 id="how-it-works" className="mb-3 font-heading text-sm font-bold">
              How it works
            </h2>
            <ol className="flex flex-col gap-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center bg-primary font-heading text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-sm text-muted-foreground">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="what-to-submit" className="border bg-card p-4">
            <h2 id="what-to-submit" className="mb-3 font-heading text-sm font-bold">
              What you can submit
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {TYPES.map((t) => (
                <li key={t.title} className="flex gap-3">
                  <t.icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <div>
                    <p className="text-sm font-medium">{t.title}</p>
                    <p className="text-sm text-muted-foreground">{t.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="track-title" className="border bg-card p-4">
            <h2 id="track-title" className="mb-3 font-heading text-sm font-bold">
              Already submitted?
            </h2>
            <TrackingLookup />
          </section>

          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p className="flex gap-2">
              <RiWhatsappLine className="mt-0.5 size-4 shrink-0" aria-hidden />
              Soon: forward messages to the Zuula WhatsApp number to check them.
            </p>
            <p className="flex gap-2">
              <RiLockLine className="mt-0.5 size-4 shrink-0" aria-hidden />
              Uploaded files are scanned for malware and stored securely under the Data
              Protection and Privacy Act, 2019.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
