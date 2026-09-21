import Link from "next/link"
import {
  RiErrorWarningLine,
  RiKey2Line,
  RiSendPlaneLine,
  RiShieldKeyholeLine,
  RiSpeedLine,
  RiWebhookLine,
} from "@remixicon/react"

import { ArticleSections, type ArticleSection } from "@/components/shell/article-sections"
import { PhotoBanner } from "@/components/decor/photo-hero"
import { PHOTOS } from "@/components/decor/photos"
import { PageHeader } from "@/components/shell/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const metadata = {
  title: "API",
  description: "Submit content for verification and read verdicts programmatically.",
}

function CodeBlock({ children, label }: { children: string; label?: string }) {
  return (
    <div className="overflow-hidden border bg-muted/40 not-first:mt-1">
      {label && (
        <div className="border-b bg-muted/60 px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
          {label}
        </div>
      )}
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed">
        <code className="font-mono">{children}</code>
      </pre>
    </div>
  )
}

function Endpoint({ method, path }: { method: "GET" | "POST"; path: string }) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant={method === "POST" ? "default" : "secondary"} className="font-mono">
        {method}
      </Badge>
      <code className="font-mono text-sm">{path}</code>
    </div>
  )
}

function Scope({ children }: { children: string }) {
  return (
    <Badge variant="outline" className="font-mono">
      {children}
    </Badge>
  )
}

const SECTIONS: ArticleSection[] = [
  {
    id: "overview",
    title: "Overview",
    content: (
      <>
        <p>
          The Zuula API lets newsrooms and partner tools submit content for verification and read
          back the verdict, evidence and community score &mdash; the same pipeline that powers{" "}
          <Link href="/verify">Verify</Link>, callable from your own systems.
        </p>
        <div className="flex gap-3 border border-verdict-unverifiable/40 bg-verdict-unverifiable/5 p-4 text-foreground">
          <RiErrorWarningLine className="mt-0.5 size-4 shrink-0 text-verdict-unverifiable" aria-hidden />
          <p>
            The API is being designed in Phase 2 (12&ndash;20 Oct 2026) and isn&apos;t callable
            yet &mdash; everything below is the current design, kept in step with the mock data
            the rest of the site runs on. It will update as the FastAPI backend ships.
          </p>
        </div>
        <p>
          All requests and responses are JSON over HTTPS, at a base URL of{" "}
          <code>https://api.zuula.ug/v1</code>.
        </p>
      </>
    ),
  },
  {
    id: "auth",
    title: "Authentication",
    content: (
      <>
        <p>
          Every request needs an API key in the <code>Authorization</code> header. Journalist and
          Admin accounts can create one from{" "}
          <Link href="/account/api-access">Account &rarr; API Keys</Link>. Keys are shown once, on
          creation &mdash; store them in a secret manager, never in front-end code.
        </p>
        <CodeBlock>{`Authorization: Bearer zl_live_a1b2c3d4e5f6...`}</CodeBlock>
        <p>Each key is scoped to what it&apos;s allowed to do:</p>
        <ul>
          <li>
            <Scope>submit</Scope> — <code>POST /v1/checks</code>: send text, links or media for
            verification.
          </li>
          <li>
            <Scope>read</Scope> — <code>GET /v1/checks</code> and <code>GET /v1/fact-checks</code>:
            read status, verdicts, explanations and citations.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "rate-limits",
    title: "Rate limits",
    content: (
      <>
        <p>
          Keys are limited to <strong>100 requests per hour</strong>. Current usage is on the{" "}
          <Link href="/account/api-access">API Keys</Link> page. Over the limit, the API returns{" "}
          <code>429 Too Many Requests</code> with a <code>Retry-After</code> header in seconds.
          Need a higher limit for a newsroom integration? See{" "}
          <a href="#access">Get access</a> below.
        </p>
      </>
    ),
  },
  {
    id: "submit",
    title: "Submit content for checking",
    content: (
      <>
        <Endpoint method="POST" path="/v1/checks" />
        <p>
          Send text, a link, or media (as a multipart upload). Returns immediately with a tracking
          ID &mdash; the same one shown on the <Link href="/verify">Verify</Link> page &mdash; while
          analysis runs in the background.
        </p>
        <CodeBlock label="Request">{`POST /v1/checks HTTP/1.1
Host: api.zuula.ug
Authorization: Bearer zl_live_...
Content-Type: application/json

{
  "type": "text",
  "content": "BREAKING: The Ministry of ICT has announced that every Ugandan\\nwill get free unlimited internet from January 2027...",
  "language": "en"
}`}</CodeBlock>
        <CodeBlock label="202 Accepted">{`{
  "trackingId": "ZL-7K3P-Q9",
  "checkId": "fc-2026-0142",
  "status": "processing"
}`}</CodeBlock>
        <p>
          <code>type</code> is one of <code>text</code>, <code>url</code>, <code>image</code>,{" "}
          <code>audio</code> or <code>video</code>. Media uploads are capped at 50&nbsp;MB and are
          scanned for malware before analysis starts.
        </p>
      </>
    ),
  },
  {
    id: "status",
    title: "Check status",
    content: (
      <>
        <Endpoint method="GET" path="/v1/checks/{trackingId}" />
        <p>
          Poll this while a check is running, or use it to look up any tracking ID a user gives
          you. Text finishes in about 10 seconds, media in up to a minute.
        </p>
        <CodeBlock label="200 OK — in progress">{`{
  "trackingId": "ZL-7K3P-Q9",
  "status": "processing",
  "stage": "sources",
  "progress": 0.7
}`}</CodeBlock>
        <CodeBlock label="200 OK — done">{`{
  "trackingId": "ZL-7K3P-Q9",
  "status": "complete",
  "factCheckId": "fc-2026-0142"
}`}</CodeBlock>
      </>
    ),
  },
  {
    id: "results",
    title: "Get a fact-check report",
    content: (
      <>
        <Endpoint method="GET" path="/v1/fact-checks/{id}" />
        <p>
          The full report: verdict, confidence, a plain-language summary, the citations it&apos;s
          based on, and the current community score. This is the same data behind the public{" "}
          <Link href="/fact-checks/fc-2026-0142">report page</Link>.
        </p>
        <CodeBlock label="200 OK">{`{
  "id": "fc-2026-0142",
  "trackingId": "ZL-7K3P-Q9",
  "verdict": "false",
  "confidence": 92,
  "summary": "No free national internet programme has been announced. The message matches a known phishing pattern that asks people to submit their National ID number through an unofficial link.",
  "citations": [
    {
      "sourceName": "Ministry of ICT",
      "title": "Statement on public Wi-Fi expansion",
      "url": "https://ict.go.ug",
      "stance": "contradicts",
      "trusted": true
    }
  ],
  "community": { "ccs": 96, "totalRatings": 812 },
  "checkedAt": "2026-09-14T10:02:00Z"
}`}</CodeBlock>
        <p>
          <code>verdict</code> is one of <code>authentic</code>, <code>likely-false</code>,{" "}
          <code>false</code>, <code>ai-generated</code> or <code>unverifiable</code>.{" "}
          <code>community.ccs</code> is the weighted Community Confidence Score behind the
          verdict, 0&ndash;100.
        </p>
      </>
    ),
  },
  {
    id: "webhooks",
    title: "Webhooks",
    content: (
      <p>
        Planned alongside the API, so you don&apos;t have to poll: a callback when a submitted
        check&apos;s verdict is ready. This section will be filled in once webhook delivery is
        designed in Phase 2. In the meantime, the Zuula bots on{" "}
        <Link href="/about#whatsapp">WhatsApp and Telegram</Link> are being built on the same
        webhook infrastructure.
      </p>
    ),
  },
  {
    id: "errors",
    title: "Errors",
    content: (
      <table className="w-full border text-left text-xs">
        <thead className="bg-muted/60 text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Meaning</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {[
            ["400 Bad Request", "Missing or invalid field, or an unsupported content type."],
            ["401 Unauthorized", "Missing or invalid API key."],
            ["403 Forbidden", "The key's scope doesn't allow this request."],
            ["404 Not Found", "No check or fact-check with that ID."],
            ["429 Too Many Requests", "Over the hourly rate limit — see Retry-After."],
            ["500 Internal Server Error", "Something failed on our end. Safe to retry."],
          ].map(([code, meaning]) => (
            <tr key={code}>
              <td className="px-3 py-2 font-mono whitespace-nowrap">{code}</td>
              <td className="px-3 py-2 text-muted-foreground">{meaning}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
  },
  {
    id: "access",
    title: "Get access",
    content: (
      <>
        <p>
          Journalist and Admin accounts can self-serve a key today from{" "}
          <Link href="/account/api-access">Account &rarr; API Keys</Link> &mdash; it works against
          mock data until the backend ships. For a newsroom integration or a higher rate limit,
          email <a href="mailto:hello@zuula.ug">hello@zuula.ug</a>. Using the API also means
          accepting the <Link href="/legal/terms#api">API terms</Link>.
        </p>
      </>
    ),
  },
]

const QUICK_LINKS = [
  { icon: RiKey2Line, title: "Authentication", href: "#auth" },
  { icon: RiSpeedLine, title: "Rate limits", href: "#rate-limits" },
  { icon: RiSendPlaneLine, title: "Submit content", href: "#submit" },
  { icon: RiWebhookLine, title: "Webhooks", href: "#webhooks" },
]

export default function DevelopersPage() {
  return (
    <>
      <PhotoBanner
        photo={PHOTOS.crimsonWaves}
        position="center"
        eyebrow="Developers"
        title="API"
        description="Submit content for verification and read verdicts programmatically."
      />
      <div className="page-container flex flex-col gap-10 py-10">
        <PageHeader
          title="API reference"
          description="REST, JSON over HTTPS. One key, three endpoints."
          actions={
            <Button variant="outline" asChild>
              <Link href="/account/api-access">
                <RiShieldKeyholeLine aria-hidden />
                Get an API key
              </Link>
            </Button>
          }
        />
        <div data-reveal="stagger" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={cn(
                "hover-lift flex items-center gap-2.5 border bg-card p-3 text-sm font-medium",
                "transition-colors hover:border-primary hover:text-primary"
              )}
            >
              <l.icon className="size-4 shrink-0 text-primary" aria-hidden />
              {l.title}
            </a>
          ))}
        </div>
        <ArticleSections sections={SECTIONS} className="max-w-none" />
      </div>
    </>
  )
}
