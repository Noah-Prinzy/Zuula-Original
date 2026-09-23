import type { Metadata } from "next"
import Link from "next/link"
import { getLocale, getTranslations } from "next-intl/server"

import {
  ArticleSections,
  type ArticleSection,
} from "@/components/shell/article-sections"
import { PageSheet } from "@/components/decor/page-sheet"
import { PageHeader } from "@/components/shell/page-header"
import { Badge } from "@/components/ui/badge"
import { TIME_ZONE } from "@/i18n/config"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal.privacy")
  return { title: t("metaTitle"), description: t("metaDescription") }
}

const LAST_UPDATED = new Date("2026-09-21T12:00:00+03:00")

// List items are keyed by id under Legal.privacy.sections.<section>.items.
const COLLECT = [
  "account",
  "submissions",
  "ratings",
  "accreditation",
  "device",
] as const
const USE = ["pipeline", "ccs", "accreditation", "abuse", "accuracy"] as const
const RIGHTS = ["access", "correct", "delete", "object", "complain"] as const

const strong = (chunks: React.ReactNode) => <strong>{chunks}</strong>

export default async function PrivacyPage() {
  const tl = await getTranslations("Legal")
  const t = await getTranslations("Legal.privacy.sections")
  // English dates read day-first ("21 September 2026"), matching the rest of the app.
  const locale = await getLocale()
  const lastUpdated = new Intl.DateTimeFormat(
    locale === "en" ? "en-GB" : locale,
    {
      dateStyle: "long",
      timeZone: TIME_ZONE,
    }
  ).format(LAST_UPDATED)

  const SECTIONS: ArticleSection[] = [
    {
      id: "overview",
      title: t("overview.title"),
      content: <p>{t.rich("overview.body", { strong })}</p>,
    },
    {
      id: "collect",
      title: t("collect.title"),
      content: (
        <ul>
          {COLLECT.map((k) => (
            <li key={k}>{t.rich(`collect.items.${k}`, { strong })}</li>
          ))}
        </ul>
      ),
    },
    {
      id: "use",
      title: t("use.title"),
      content: (
        <ul>
          {USE.map((k) => (
            <li key={k}>{t(`use.items.${k}`)}</li>
          ))}
        </ul>
      ),
    },
    {
      id: "ai-sharing",
      title: t("aiSharing.title"),
      content: (
        <>
          <p>{t("aiSharing.body")}</p>
          <p>{t("aiSharing.review")}</p>
        </>
      ),
    },
    {
      id: "dppa",
      title: t("dppa.title"),
      content: (
        <>
          <p>{t("dppa.intro")}</p>
          <ul>
            {RIGHTS.map((k) => (
              <li key={k}>{t(`dppa.items.${k}`)}</li>
            ))}
          </ul>
          <p>
            {t.rich("dppa.outro", {
              contact: (chunks) => <a href="#contact">{chunks}</a>,
            })}
          </p>
        </>
      ),
    },
    {
      id: "retention",
      title: t("retention.title"),
      content: <p>{t("retention.body")}</p>,
    },
    {
      id: "cookies",
      title: t("cookies.title"),
      content: <p>{t("cookies.body")}</p>,
    },
    {
      id: "children",
      title: t("children.title"),
      content: <p>{t("children.body")}</p>,
    },
    {
      id: "changes",
      title: t("changes.title"),
      content: (
        <p>
          {t.rich("changes.body", {
            home: (chunks) => <Link href="/">{chunks}</Link>,
          })}
        </p>
      ),
    },
    {
      id: "contact",
      title: t("contact.title"),
      content: (
        <p>
          {t.rich("contact.body", {
            email: (chunks) => <a href="mailto:privacy@zuula.ug">{chunks}</a>,
            terms: (chunks) => <Link href="/legal/terms">{chunks}</Link>,
          })}
        </p>
      ),
    },
  ]

  return (
    <PageSheet>
      <PageHeader
        title={tl("privacy.title")}
        description={tl("privacy.description")}
        className="page-container pt-8"
      />
      <div className="flex page-container flex-col gap-10 py-10">
        <Badge variant="outline" className="w-fit">
          {tl("lastUpdated", { date: lastUpdated })}
        </Badge>
        <ArticleSections sections={SECTIONS} />
      </div>
    </PageSheet>
  )
}
