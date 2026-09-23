import type { Metadata } from "next"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import {
  RiArrowRightLine,
  RiFileSearchLine,
  RiGlobalLine,
  RiGovernmentLine,
  RiGroupLine,
  RiMailLine,
  RiRobot2Line,
  RiScales3Line,
  RiShieldCheckLine,
  RiWhatsappLine,
} from "@remixicon/react"

import { PageHero, PageSheet } from "@/components/decor/page-sheet"
import { SectionTitle } from "@/components/motion/section"
import { KineticText } from "@/components/motion/text/kinetic-text"
import { ScrambleText } from "@/components/motion/text/scramble-text"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { VerdictBadge } from "@/components/verdict/verdict-badge"
import { VERDICTS } from "@/lib/types/fact-check"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("About")
  return { title: t("metaTitle"), description: t("metaDescription") }
}

// "Why Zuula" band, moved here from Home. Text under About.why.features.
const FEATURES = [
  { key: "sources", icon: RiShieldCheckLine },
  { key: "ai", icon: RiRobot2Line },
  { key: "languages", icon: RiGlobalLine },
] as const

const STEPS = ["submit", "check", "publish", "review"] as const

const PRINCIPLES = [
  { key: "label", icon: RiShieldCheckLine },
  { key: "rules", icon: RiScales3Line },
  { key: "accountable", icon: RiGroupLine },
  { key: "sources", icon: RiFileSearchLine },
] as const

// "verdicts" has no text answer; it renders the verdict list instead.
const FAQS = [
  "free",
  "submit",
  "time",
  "verdicts",
  "disagree",
  "languages",
  "data",
  "who",
] as const

export default async function AboutPage() {
  const t = await getTranslations("About")
  const tv = await getTranslations("Verdicts")
  const link = (href: string) =>
    function RichLink(chunks: React.ReactNode) {
      return (
        <Link href={href} className="link-grow text-foreground">
          {chunks}
        </Link>
      )
    }

  return (
    <>
      <PageHero
        eyebrow={t("banner.eyebrow")}
        title={t("banner.title")}
        description={t("banner.description")}
      />

      <PageSheet>
        {/* One photo per page: "Why Zuula" sits on the sheet, not on a second image. */}
        <section aria-labelledby="why-title" className="border-b">
          <div className="flex page-container flex-col gap-12 py-16">
            <div data-reveal className="flex max-w-3xl flex-col gap-3">
              <p className="font-heading text-xs font-semibold tracking-widest text-primary uppercase">
                <ScrambleText text={t("why.eyebrow")} />
              </p>
              <h2
                id="why-title"
                className="font-heading text-3xl font-bold tracking-tight text-balance md:text-5xl"
              >
                <KineticText
                  text={t("why.title")}
                  highlight={[t("why.highlight")]}
                />
              </h2>
            </div>
            <div data-reveal="stagger" className="grid gap-4 md:grid-cols-3">
              {FEATURES.map((f) => (
                <div
                  key={f.key}
                  className="hover-lift flex flex-col gap-3 border bg-card p-6 text-card-foreground"
                >
                  <f.icon className="size-7 text-primary" aria-hidden />
                  <h3 className="font-heading text-lg font-bold">
                    {t(`why.features.${f.key}.title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t(`why.features.${f.key}.body`)}
                  </p>
                </div>
              ))}
            </div>
            <div data-reveal>
              <Button size="lg" asChild>
                <Link href="/verify">
                  {t("why.cta")} <RiArrowRightLine aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <div className="flex page-container flex-col gap-16 py-14">
          <section
            data-reveal
            aria-labelledby="mission-title"
            className="flex flex-col gap-4"
          >
            <Badge variant="outline" className="w-fit">
              {t("mission.badge")}
            </Badge>
            {/* PageHero holds the page's only <h1>. */}
            <h2
              id="mission-title"
              className="max-w-3xl font-heading text-2xl font-bold text-balance md:text-3xl"
            >
              {t("mission.title")}
            </h2>
            <p className="max-w-2xl text-base text-muted-foreground">
              {t("mission.body")}
            </p>
          </section>

          <section
            id="methodology"
            data-reveal
            className="flex scroll-mt-24 flex-col gap-8"
          >
            <SectionTitle
              eyebrow={t("methodology.eyebrow")}
              title={t("methodology.title")}
              description={t("methodology.description")}
            />
            <ol data-reveal="stagger" className="grid gap-4 sm:grid-cols-2">
              {STEPS.map((s, i) => (
                <li
                  key={s}
                  className="hover-lift flex gap-3 border bg-card p-4"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center bg-primary font-heading text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">
                      {t(`methodology.steps.${s}.title`)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t(`methodology.steps.${s}.body`)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section
            id="independence"
            data-reveal
            className="flex scroll-mt-24 flex-col gap-8"
          >
            <SectionTitle
              eyebrow={t("independence.eyebrow")}
              title={t("independence.title")}
              description={t("independence.description")}
            />
            <div data-reveal="stagger" className="grid gap-4 md:grid-cols-2">
              {PRINCIPLES.map((p) => (
                <div
                  key={p.key}
                  className="hover-lift flex gap-3 border bg-card p-4"
                >
                  <p.icon
                    className="mt-0.5 size-5 shrink-0 text-primary"
                    aria-hidden
                  />
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">
                      {t(`independence.principles.${p.key}.title`)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t(`independence.principles.${p.key}.body`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section
            id="whatsapp"
            data-reveal
            className="flex scroll-mt-24 flex-col gap-6"
          >
            <SectionTitle
              eyebrow={t("whatsapp.eyebrow")}
              title={t("whatsapp.title")}
              description={t("whatsapp.description")}
            />
            <div className="hover-lift flex flex-col gap-3 border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <RiWhatsappLine
                  className="mt-0.5 size-6 shrink-0 text-primary"
                  aria-hidden
                />
                <p className="max-w-xl text-sm text-muted-foreground">
                  {t.rich("whatsapp.body", { link: link("/verify") })}
                </p>
              </div>
              <Badge variant="outline" className="w-fit shrink-0">
                {t("whatsapp.badge")}
              </Badge>
            </div>
          </section>

          <section
            id="faq"
            data-reveal
            className="flex scroll-mt-24 flex-col gap-8"
          >
            <SectionTitle eyebrow={t("faq.eyebrow")} title={t("faq.title")} />
            <Accordion type="single" collapsible className="max-w-3xl border-t">
              {FAQS.map((f) => (
                <AccordionItem key={f} value={f}>
                  <AccordionTrigger className="py-4 text-sm">
                    {t(`faq.items.${f}.q`)}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {f === "verdicts" ? (
                      <ul className="flex flex-col gap-2">
                        {VERDICTS.map((v) => (
                          <li key={v} className="flex items-center gap-2">
                            <VerdictBadge verdict={v} size="sm" />
                            <span>{tv(`descriptions.${v}`)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>
                        {t.rich(`faq.items.${f}.a`, {
                          link: link("/legal/privacy"),
                        })}
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <section
            id="contact"
            data-reveal
            className="flex scroll-mt-24 flex-col gap-6 border-t pt-14"
          >
            <SectionTitle
              eyebrow={t("contact.eyebrow")}
              title={t("contact.title")}
              description={t("contact.description")}
            />
            <div data-reveal="stagger" className="grid gap-4 sm:grid-cols-2">
              <div className="hover-lift flex flex-col gap-3 border bg-card p-6">
                <RiMailLine className="size-5 text-primary" aria-hidden />
                <div>
                  <p className="text-sm font-medium">
                    {t("contact.general.title")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("contact.general.body")}
                  </p>
                </div>
                <a
                  href="mailto:hello@zuula.ug"
                  className="link-grow w-fit text-sm font-medium"
                >
                  hello@zuula.ug
                </a>
              </div>
              <div className="hover-lift flex flex-col gap-3 border bg-card p-6">
                <RiGovernmentLine className="size-5 text-primary" aria-hidden />
                <div>
                  <p className="text-sm font-medium">
                    {t("contact.cit.title")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("contact.cit.body")}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild className="w-fit">
                  <Link href="/developers">{t("contact.cit.cta")}</Link>
                </Button>
              </div>
            </div>
          </section>
        </div>
      </PageSheet>
    </>
  )
}
