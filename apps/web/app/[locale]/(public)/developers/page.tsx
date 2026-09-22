import type { Metadata } from "next"
import Link from "next/link"
import { RiErrorWarningLine, RiKey2Line, RiMailLine, RiTimerLine, RiWebhookLine } from "@remixicon/react"
import { getTranslations } from "next-intl/server"

import { PageHero, PageSheet } from "@/components/decor/page-sheet"
import { CodeBlock, CodeSamples } from "@/components/developers/code-block"
import {
  API_RATE_LIMIT,
  BASE_URL,
  ERROR_RESPONSE,
  RATE_HEADERS,
  REPORT,
  REPORT_RESPONSE,
  SAMPLE_REPORT_ID,
  SEARCH,
  SEARCH_RESPONSE,
  STATUS,
  STATUS_RESPONSE,
  SUBMIT,
  SUBMIT_RESPONSE,
} from "@/components/developers/examples"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { LIMITS, MAX_FILE_BYTES, formatBytes } from "@/lib/submission"
import { cn } from "@/lib/utils"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Developers")
  return { title: t("metaTitle"), description: t("metaDescription") }
}

const SECTIONS = [
  "overview",
  "authentication",
  "rate-limits",
  "submit",
  "status",
  "report",
  "search",
  "fact-check",
  "webhooks",
  "errors",
  "access",
] as const

type Section = (typeof SECTIONS)[number]

const TOC_KEYS = {
  overview: "overview",
  authentication: "authentication",
  "rate-limits": "rateLimits",
  submit: "submit",
  status: "status",
  report: "report",
  search: "search",
  "fact-check": "factCheck",
  webhooks: "webhooks",
  errors: "errors",
  access: "access",
} as const satisfies Record<Section, string>

type Row = { name: string; type: string; required?: boolean; description: React.ReactNode }

const code = (chunks: React.ReactNode) => (
  <code className="bg-muted px-1 py-0.5 font-mono text-[0.85em]">{chunks}</code>
)

function inlineLink(href: string) {
  return function InlineLink(chunks: React.ReactNode) {
    return (
      <Link href={href} className="font-medium text-primary underline-offset-2 hover:underline">
        {chunks}
      </Link>
    )
  }
}

async function FieldTable({ rows, caption }: { rows: Row[]; caption: string }) {
  const t = await getTranslations("Developers.table")
  return (
    <div className="overflow-x-auto border">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-muted/50 text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">{t("field")}</th>
            <th scope="col" className="px-3 py-2 font-medium">{t("type")}</th>
            <th scope="col" className="px-3 py-2 font-medium">{t("description")}</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r) => (
            <tr key={r.name} className="align-top">
              <td className="px-3 py-2.5 whitespace-nowrap">
                <code className="font-mono text-[0.8125rem] font-medium">{r.name}</code>
                {r.required && (
                  <span className="ml-2 text-[0.6875rem] font-medium tracking-wide text-primary uppercase">
                    {t("required")}
                  </span>
                )}
              </td>
              <td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap text-muted-foreground">{r.type}</td>
              <td className="px-3 py-2.5 text-muted-foreground">{r.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DocSection({
  id,
  title,
  children,
  className,
}: {
  id: Section
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section id={id} data-reveal aria-labelledby={`${id}-title`} className={cn("flex scroll-mt-24 flex-col gap-4", className)}>
      <h2 id={`${id}-title`} className="font-heading text-2xl font-bold tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Endpoint({ method, path, scope }: { method: "GET" | "POST"; path: string; scope: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border bg-card px-3 py-2 font-mono text-sm">
      <span
        className={cn(
          "px-1.5 py-0.5 text-xs font-bold",
          method === "POST" ? "bg-primary text-primary-foreground" : "bg-verdict-authentic/15 text-verdict-authentic"
        )}
      >
        {method}
      </span>
      <span className="break-all">{path}</span>
      <Badge variant="outline" className="ml-auto font-sans">
        {scope}
      </Badge>
    </div>
  )
}

function Subheading({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-2 font-heading text-base font-bold">{children}</h3>
}

// FR-API-01/03: public documentation for the verification API. Preview until v1.
export default async function DevelopersPage() {
  const t = await getTranslations("Developers")
  const scope = (s: "submit" | "read") => t("scopeBadge", { scope: s })

  const submitFields: Row[] = [
    { name: "type", type: "string", required: true, description: t.rich("submit.fields.type", { code }) },
    {
      name: "content",
      type: "string",
      description: t("submit.fields.content", { textMax: LIMITS.text.max, articleMax: LIMITS.article.max }),
    },
    { name: "url", type: "string", description: t("submit.fields.url") },
    { name: "file", type: "binary", description: t("submit.fields.file", { size: formatBytes(MAX_FILE_BYTES) }) },
    { name: "headline", type: "string", description: t("submit.fields.headline", { max: LIMITS.headline.max }) },
    { name: "language", type: "string", description: t.rich("submit.fields.language", { code }) },
  ]

  const searchParams: Row[] = [
    { name: "q", type: "string", description: t("search.params.q") },
    { name: "verdict", type: "string", description: t.rich("search.params.verdict", { code }) },
    { name: "category", type: "string", description: t("search.params.category") },
    { name: "language", type: "string", description: t("search.params.language") },
    { name: "from, to", type: "date", description: t("search.params.dates") },
    { name: "page", type: "integer", description: t("search.params.page") },
    { name: "perPage", type: "integer", description: t("search.params.perPage") },
  ]

  const factCheckFields: Row[] = [
    { name: "id", type: "string", description: t("factCheck.fields.id") },
    { name: "trackingId", type: "string", description: t("factCheck.fields.trackingId") },
    { name: "verdict", type: "string", description: t.rich("factCheck.fields.verdict", { code }) },
    { name: "confidence", type: "integer", description: t("factCheck.fields.confidence") },
    { name: "summary", type: "string", description: t("factCheck.fields.summary") },
    { name: "whatIsFalse, whatIsTrue", type: "string[]", description: t("factCheck.fields.findings") },
    { name: "claims", type: "Claim[]", description: t("factCheck.fields.claims") },
    { name: "citations", type: "Citation[]", description: t.rich("factCheck.fields.citations", { code }) },
    { name: "aiSignals", type: "AISignal[]", description: t("factCheck.fields.aiSignals") },
    { name: "community", type: "object", description: t("factCheck.fields.community") },
    { name: "humanReview", type: "object | null", description: t("factCheck.fields.humanReview") },
    { name: "checkedAt", type: "string", description: t("factCheck.fields.checkedAt") },
  ]

  const errors = [
    ["400", "bad_request"],
    ["401", "unauthorized"],
    ["403", "forbidden"],
    ["404", "not_found"],
    ["413", "file_too_large"],
    ["415", "unsupported_media"],
    ["422", "invalid_content"],
    ["429", "rate_limited"],
    ["500", "server_error"],
  ] as const

  return (
    <>
      <PageHero
        eyebrow={t("banner.eyebrow")}
        title={t("banner.title")}
        description={t("banner.description")}
      />

      <PageSheet>
      <div className="page-container grid gap-10 py-10 lg:grid-cols-[13rem_minmax(0,1fr)] xl:gap-14">
        <nav aria-label={t("toc.label")} className="hidden lg:block">
          <div className="sticky top-24 flex flex-col gap-2">
            <p className="px-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">{t("toc.label")}</p>
            <ul className="flex flex-col gap-0.5 border-l">
              {SECTIONS.map((s) => (
                <li key={s}>
                  <a
                    href={`#${s}`}
                    className="-ml-px block border-l-2 border-transparent px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                  >
                    {t(`toc.${TOC_KEYS[s]}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="flex max-w-4xl min-w-0 flex-col gap-14">
          <Alert className="enter">
            <RiErrorWarningLine aria-hidden />
            <AlertTitle>{t("preview.title")}</AlertTitle>
            <AlertDescription>{t("preview.body")}</AlertDescription>
          </Alert>

          <DocSection id="overview" title={t("overview.title")}>
            <p className="text-muted-foreground">{t("overview.body")}</p>
            <ol className="flex list-decimal flex-col gap-1 pl-5 text-muted-foreground marker:text-primary">
              <li>{t.rich("overview.step1", { code })}</li>
              <li>{t.rich("overview.step2", { code })}</li>
              <li>{t("overview.step3")}</li>
            </ol>
            <dl className="grid gap-x-6 gap-y-2 border bg-card p-4 text-sm sm:grid-cols-[auto_1fr]">
              <dt className="font-medium">{t("overview.baseUrl")}</dt>
              <dd className="font-mono break-all">{BASE_URL}</dd>
              <dt className="font-medium">{t("overview.formatLabel")}</dt>
              <dd className="text-muted-foreground">{t("overview.format")}</dd>
            </dl>
          </DocSection>

          <DocSection id="authentication" title={t("auth.title")}>
            <p className="text-muted-foreground">
              {t.rich("auth.body", {
                code,
                link: inlineLink("/account/api-access"),
              })}
            </p>
            <CodeBlock label={t("auth.headerLabel")} code="Authorization: Bearer zl_live_4f7a••••••••••••••••" />
            <ul className="grid gap-3 sm:grid-cols-2">
              {(["submit", "read"] as const).map((s) => (
                <li key={s} className="flex gap-3 border bg-card p-4">
                  <RiKey2Line className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                  <div className="flex flex-col gap-1">
                    <code className="font-mono text-sm font-medium">{s}</code>
                    <span className="text-sm text-muted-foreground">{t(`auth.scopes.${s}`)}</span>
                  </div>
                </li>
              ))}
            </ul>
            <Alert variant="destructive">
              <RiErrorWarningLine aria-hidden />
              <AlertTitle>{t("auth.serverOnlyTitle")}</AlertTitle>
              <AlertDescription>{t("auth.serverOnly")}</AlertDescription>
            </Alert>
          </DocSection>

          <DocSection id="rate-limits" title={t("rate.title")}>
            <p className="flex gap-3 text-muted-foreground">
              <RiTimerLine className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <span>{t.rich("rate.body", { limit: API_RATE_LIMIT, code })}</span>
            </p>
            <FieldTable
              caption={t("rate.title")}
              rows={[
                { name: "X-RateLimit-Limit", type: "header", description: t("rate.headers.limit") },
                { name: "X-RateLimit-Remaining", type: "header", description: t("rate.headers.remaining") },
                { name: "X-RateLimit-Reset", type: "header", description: t("rate.headers.reset") },
                { name: "Retry-After", type: "header", description: t("rate.headers.retryAfter") },
              ]}
            />
            <CodeBlock label={t("code.responseHeaders")} code={RATE_HEADERS} />
          </DocSection>

          <DocSection id="submit" title={t("submit.title")}>
            <Endpoint method="POST" path="/v1/checks" scope={scope("submit")} />
            <p className="text-muted-foreground">{t.rich("submit.body", { code })}</p>
            <Subheading>{t("common.requestBody")}</Subheading>
            <FieldTable caption={t("common.requestBody")} rows={submitFields} />
            <Subheading>{t("common.example")}</Subheading>
            <CodeSamples samples={SUBMIT} />
            <CodeBlock label={t("code.response", { status: "202 Accepted" })} code={SUBMIT_RESPONSE} />
          </DocSection>

          <DocSection id="status" title={t("status.title")}>
            <Endpoint method="GET" path="/v1/checks/{trackingId}" scope={scope("read")} />
            <p className="text-muted-foreground">{t.rich("status.body", { code })}</p>
            <FieldTable
              caption={t("status.statesCaption")}
              rows={(["queued", "processing", "completed", "failed"] as const).map((s) => ({
                name: s,
                type: "status",
                description: t(`status.states.${s}`),
              }))}
            />
            <Subheading>{t("common.example")}</Subheading>
            <CodeSamples samples={STATUS} />
            <CodeBlock label={t("code.response", { status: "200 OK" })} code={STATUS_RESPONSE} />
          </DocSection>

          <DocSection id="report" title={t("report.title")}>
            <Endpoint method="GET" path="/v1/fact-checks/{id}" scope={scope("read")} />
            <p className="text-muted-foreground">
              {t.rich("report.body", { link: inlineLink(`/fact-checks/${SAMPLE_REPORT_ID}`) })}
            </p>
            <Subheading>{t("common.example")}</Subheading>
            <CodeSamples samples={REPORT} />
            <CodeBlock label={t("code.response", { status: "200 OK" })} code={REPORT_RESPONSE} />
          </DocSection>

          <DocSection id="search" title={t("search.title")}>
            <Endpoint method="GET" path="/v1/fact-checks" scope={scope("read")} />
            <p className="text-muted-foreground">{t("search.body")}</p>
            <Subheading>{t("common.queryParameters")}</Subheading>
            <FieldTable caption={t("common.queryParameters")} rows={searchParams} />
            <Subheading>{t("common.example")}</Subheading>
            <CodeSamples samples={SEARCH} />
            <CodeBlock label={t("code.response", { status: "200 OK" })} code={SEARCH_RESPONSE} />
          </DocSection>

          <DocSection id="fact-check" title={t("factCheck.title")}>
            <p className="text-muted-foreground">{t("factCheck.body")}</p>
            <FieldTable caption={t("factCheck.title")} rows={factCheckFields} />
          </DocSection>

          <DocSection id="webhooks" title={t("webhooks.title")}>
            <p className="flex gap-3 text-muted-foreground">
              <RiWebhookLine className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <span>{t.rich("webhooks.body", { link: inlineLink("/about#whatsapp") })}</span>
            </p>
          </DocSection>

          <DocSection id="errors" title={t("errors.title")}>
            <p className="text-muted-foreground">{t.rich("errors.body", { code })}</p>
            <FieldTable
              caption={t("errors.title")}
              rows={errors.map(([status, key]) => ({
                name: status,
                type: key,
                description: t(`errors.codes.${key}`),
              }))}
            />
            <CodeBlock label={t("code.response", { status: "429 Too Many Requests" })} code={ERROR_RESPONSE} />
          </DocSection>

          <DocSection id="access" title={t("access.title")}>
            <p className="flex gap-3 text-muted-foreground">
              <RiMailLine className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <span>
                {t.rich("access.body", {
                  keys: inlineLink("/account/api-access"),
                  terms: inlineLink("/legal/terms#api"),
                  email: (chunks) => (
                    <a href="mailto:hello@zuula.ug" className="font-medium text-primary underline-offset-2 hover:underline">
                      {chunks}
                    </a>
                  ),
                })}
              </span>
            </p>
          </DocSection>
        </div>
      </div>
      </PageSheet>
    </>
  )
}
