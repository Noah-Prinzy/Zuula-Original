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
  const t = await getTranslations("Legal.terms")
  return { title: t("metaTitle"), description: t("metaDescription") }
}

const LAST_UPDATED = new Date("2026-09-21T12:00:00+03:00")
const API_RATE_LIMIT = 100

// List items are keyed by id under Legal.terms.sections.accounts.items.
const ACCOUNT_RULES = ["roles", "accurate", "one", "twoFactor"] as const

export default async function TermsPage() {
  const tl = await getTranslations("Legal")
  const t = await getTranslations("Legal.terms.sections")
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
      id: "acceptance",
      title: t("acceptance.title"),
      content: <p>{t("acceptance.body")}</p>,
    },
    {
      id: "service",
      title: t("service.title"),
      content: <p>{t("service.body")}</p>,
    },
    {
      id: "accounts",
      title: t("accounts.title"),
      content: (
        <ul>
          {ACCOUNT_RULES.map((k) => (
            <li key={k}>{t(`accounts.items.${k}`)}</li>
          ))}
        </ul>
      ),
    },
    {
      id: "submissions",
      title: t("submissions.title"),
      content: (
        <>
          <p>{t("submissions.body")}</p>
          <p>{t("submissions.publish")}</p>
        </>
      ),
    },
    {
      id: "ratings",
      title: t("ratings.title"),
      content: <p>{t("ratings.body")}</p>,
    },
    {
      id: "api",
      title: t("api.title"),
      content: (
        <p>
          {t.rich("api.body", {
            limit: API_RATE_LIMIT,
            keys: (chunks) => <Link href="/account/api-access">{chunks}</Link>,
            dev: (chunks) => <Link href="/developers">{chunks}</Link>,
          })}
        </p>
      ),
    },
    {
      id: "ip",
      title: t("ip.title"),
      content: <p>{t("ip.body")}</p>,
    },
    {
      id: "disclaimer",
      title: t("disclaimer.title"),
      content: <p>{t("disclaimer.body")}</p>,
    },
    {
      id: "termination",
      title: t("termination.title"),
      content: <p>{t("termination.body")}</p>,
    },
    {
      id: "law",
      title: t("law.title"),
      content: <p>{t("law.body")}</p>,
    },
    {
      id: "changes",
      title: t("changes.title"),
      content: <p>{t("changes.body")}</p>,
    },
    {
      id: "contact",
      title: t("contact.title"),
      content: (
        <p>
          {t.rich("contact.body", {
            email: (chunks) => <a href="mailto:hello@zuula.ug">{chunks}</a>,
            privacy: (chunks) => <Link href="/legal/privacy">{chunks}</Link>,
          })}
        </p>
      ),
    },
  ]

  return (
    <PageSheet>
      <PageHeader
        title={tl("terms.title")}
        description={tl("terms.description")}
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
