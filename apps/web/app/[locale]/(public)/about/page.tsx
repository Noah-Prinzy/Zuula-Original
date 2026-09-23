import Link from "next/link"
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
import { VERDICT_META } from "@/lib/verdicts"

export const metadata = {
  title: "About",
  description: "Zuula's mission, methodology, editorial independence and FAQ.",
}

// "Why Zuula" band, moved here from Home.
const FEATURES = [
  {
    icon: RiShieldCheckLine,
    title: "Trusted sources",
    body: "Claims are cross-referenced against Ugandan and international outlets and fact-checkers.",
  },
  {
    icon: RiRobot2Line,
    title: "AI content detection",
    body: "Flags AI-generated text, deepfake images, synthetic audio and manipulated video.",
  },
  {
    icon: RiGlobalLine,
    title: "Ugandan languages",
    body: "English, Luganda, Acholi, Runyankole and Ateso.",
  },
]

const STEPS = [
  {
    title: "You submit a claim",
    body: "Paste text, share a link or upload media (up to 50 MB). You get a tracking ID and can follow the analysis live.",
  },
  {
    title: "We check it",
    body: "The claim is cross-referenced against trusted Ugandan and international sources, and screened for AI-generated text, deepfakes and manipulated audio or video.",
  },
  {
    title: "A verdict is published",
    body: "You see the verdict, the evidence behind it and which sources agree or disagree — never just a label.",
  },
  {
    title: "The community and our reviewers weigh in",
    body: "Readers rate the verdict. If enough people disagree, an accredited Expert reviews the case and can confirm or override it — the report is then marked “Human Verified.”",
  },
]

const PRINCIPLES = [
  {
    icon: RiShieldCheckLine,
    title: "We label, we don't delete",
    body: "Zuula never removes anyone's post. We publish an independent verdict and evidence alongside it.",
  },
  {
    icon: RiScales3Line,
    title: "Every rating carries the same rules",
    body: "Public, Journalist and Expert ratings feed the same Community Confidence Score, just weighted by track record — nobody's vote is discounted without a reason.",
  },
  {
    icon: RiGroupLine,
    title: "Reviewers are accountable",
    body: "Expert overrides require a written justification and are recorded in an append-only audit log that Admins can inspect.",
  },
  {
    icon: RiFileSearchLine,
    title: "Sources are shown, not hidden",
    body: "Every report links the evidence it was checked against, so you can verify our reasoning yourself.",
  },
]

const FAQS = [
  {
    q: "Is Zuula free to use?",
    a: "Checking a claim and reading the Library is free for everyone. Journalist and Expert accounts need accreditation, since they carry more weight in the community score and can review flagged cases.",
  },
  {
    q: "What can I submit?",
    a: "Text (like a WhatsApp forward), a link, a full article, or media — photos, voice notes and video up to 50 MB.",
  },
  {
    q: "How long does a check take?",
    a: "Text usually takes about 10 seconds. Media can take up to a minute. Cases escalated to an Expert reviewer follow a review deadline instead.",
  },
  {
    q: "What do the verdicts mean?",
    a: null, // rendered as a verdict list below
  },
  {
    q: "What if I disagree with a verdict?",
    a: "Rate it. Ratings from the Public, Journalists and Experts are combined into a Community Confidence Score. If a verdict's score drops low enough with enough ratings, it's flagged for an Expert to review and confirm or override.",
  },
  {
    q: "Which languages does Zuula support?",
    a: "Claims can be checked in English, Luganda, Acholi, Runyankole and Ateso. Translating the interface itself into those languages is still in progress — today the language switcher only remembers your preference.",
  },
  {
    q: "How is my data protected?",
    a: "Under Uganda's Data Protection and Privacy Act, 2019. See our ",
    link: { href: "/legal/privacy", label: "Privacy Policy" },
  },
  {
    q: "Who builds and funds Zuula?",
    a: "Zuula (“Uganda Fact-Guard”) is developed by the Centre for Intelligent Technologies at Victoria University Kampala as an academic and public-interest project. Verdicts are reached independently of any funder or advertiser.",
  },
]

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Zuula"
        title="About"
        description="Our mission, methodology and editorial independence."
      />

      <PageSheet>
        {/* One photo per page: "Why Zuula" sits on the sheet, not on a second image. */}
        <section aria-labelledby="why-title" className="border-b">
          <div className="flex page-container flex-col gap-12 py-16">
            <div data-reveal className="flex max-w-3xl flex-col gap-3">
              <p className="font-heading text-xs font-semibold tracking-widest text-primary uppercase">
                <ScrambleText text="Why Zuula" />
              </p>
              <h2
                id="why-title"
                className="font-heading text-3xl font-bold tracking-tight text-balance md:text-5xl"
              >
                <KineticText
                  text="Built for the way news travels in Uganda."
                  highlight={["Uganda"]}
                />
              </h2>
            </div>
            <div data-reveal="stagger" className="grid gap-4 md:grid-cols-3">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="hover-lift flex flex-col gap-3 border bg-card p-6 text-card-foreground"
                >
                  <f.icon className="size-7 text-primary" aria-hidden />
                  <h3 className="font-heading text-lg font-bold">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.body}</p>
                </div>
              ))}
            </div>
            <div data-reveal>
              <Button size="lg" asChild>
                <Link href="/verify">
                  Check a claim <RiArrowRightLine aria-hidden />
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
              Victoria University CIT
            </Badge>
            <h2
              id="mission-title"
              className="max-w-3xl font-heading text-2xl font-bold text-balance md:text-3xl"
            >
              Uganda sees a flood of forwarded claims every day. Zuula checks
              them before you share.
            </h2>
            <p className="max-w-2xl text-base text-muted-foreground">
              Zuula (branded from Uganda Fact-Guard) is an AI-assisted
              fact-checking platform built for how news actually travels here —
              on WhatsApp, in group chats and on social media, often faster than
              any newsroom can verify it. Submit a claim and get a verdict
              backed by evidence, not just an opinion.
            </p>
          </section>

          <section
            id="methodology"
            data-reveal
            className="flex scroll-mt-24 flex-col gap-8"
          >
            <SectionTitle
              eyebrow="Methodology"
              title="How we reach a verdict"
              description="Every check follows the same four steps, whether it's automated or escalated to a human reviewer."
            />
            <ol data-reveal="stagger" className="grid gap-4 sm:grid-cols-2">
              {STEPS.map((s, i) => (
                <li
                  key={s.title}
                  className="hover-lift flex gap-3 border bg-card p-4"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center bg-primary font-heading text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-sm text-muted-foreground">{s.body}</p>
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
              eyebrow="Editorial independence"
              title="Rules we hold ourselves to"
              description="Zuula's verdicts aren't for sale, and they aren't final without a way to challenge them."
            />
            <div data-reveal="stagger" className="grid gap-4 md:grid-cols-2">
              {PRINCIPLES.map((p) => (
                <div
                  key={p.title}
                  className="hover-lift flex gap-3 border bg-card p-4"
                >
                  <p.icon
                    className="mt-0.5 size-5 shrink-0 text-primary"
                    aria-hidden
                  />
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">{p.title}</p>
                    <p className="text-sm text-muted-foreground">{p.body}</p>
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
              eyebrow="Coming soon"
              title="Check a claim from WhatsApp"
              description="No app, no data bundle for a browser — forward the message and get a verdict back in the chat."
            />
            <div className="hover-lift flex flex-col gap-3 border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <RiWhatsappLine
                  className="mt-0.5 size-6 shrink-0 text-primary"
                  aria-hidden
                />
                <p className="max-w-xl text-sm text-muted-foreground">
                  A WhatsApp and Telegram bot is planned for the platform&apos;s
                  API phase, so you&apos;ll be able to forward a message
                  straight to Zuula the way you already forward it to friends.
                  It isn&apos;t live yet — for now, use{" "}
                  <Link href="/verify" className="link-grow text-foreground">
                    Verify
                  </Link>{" "}
                  on the web.
                </p>
              </div>
              <Badge variant="outline" className="w-fit shrink-0">
                Planned
              </Badge>
            </div>
          </section>

          <section
            id="faq"
            data-reveal
            className="flex scroll-mt-24 flex-col gap-8"
          >
            <SectionTitle eyebrow="FAQ" title="Frequently asked questions" />
            <Accordion type="single" collapsible className="max-w-3xl border-t">
              {FAQS.map((f) => (
                <AccordionItem key={f.q} value={f.q}>
                  <AccordionTrigger className="py-4 text-sm">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {f.a === null ? (
                      <ul className="flex flex-col gap-2">
                        {VERDICTS.map((v) => (
                          <li key={v} className="flex items-center gap-2">
                            <VerdictBadge verdict={v} size="sm" />
                            <span>{VERDICT_META[v].description}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>
                        {f.a}
                        {f.link && (
                          <Link
                            href={f.link.href}
                            className="link-grow text-foreground"
                          >
                            {f.link.label}
                          </Link>
                        )}
                        {f.link && "."}
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
              eyebrow="Contact"
              title="Get in touch"
              description="Questions about a verdict, the platform or a partnership."
            />
            <div data-reveal="stagger" className="grid gap-4 sm:grid-cols-2">
              <div className="hover-lift flex flex-col gap-3 border bg-card p-6">
                <RiMailLine className="size-5 text-primary" aria-hidden />
                <div>
                  <p className="text-sm font-medium">General enquiries</p>
                  <p className="text-sm text-muted-foreground">
                    Media, partnerships and platform questions.
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
                    Centre for Intelligent Technologies
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Victoria University, Kampala.
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild className="w-fit">
                  <Link href="/developers">API &amp; developer access</Link>
                </Button>
              </div>
            </div>
          </section>
        </div>
      </PageSheet>
    </>
  )
}
