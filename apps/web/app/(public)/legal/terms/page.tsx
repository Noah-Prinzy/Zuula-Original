import Link from "next/link"

import { ArticleSections, type ArticleSection } from "@/components/shell/article-sections"
import { PageHeader } from "@/components/shell/page-header"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Terms",
  description: "The terms that govern using Zuula.",
}

const LAST_UPDATED = "21 September 2026"

const SECTIONS: ArticleSection[] = [
  {
    id: "acceptance",
    title: "Acceptance of these terms",
    content: (
      <p>
        By using Zuula &mdash; the website, and in future the WhatsApp/Telegram bots and partner API
        &mdash; you agree to these terms. If you don&apos;t agree, please don&apos;t use the
        service.
      </p>
    ),
  },
  {
    id: "service",
    title: "What Zuula is (and isn't)",
    content: (
      <p>
        Zuula checks claims, links and media using automated detection and, where a case is
        escalated, human review by accredited reviewers. A verdict reflects our best assessment of
        the evidence available when it was published, and can change if better evidence emerges.
        Zuula is a fact-checking tool, not legal, medical or financial advice, and a verdict is not a
        substitute for your own judgement.
      </p>
    ),
  },
  {
    id: "accounts",
    title: "Accounts and roles",
    content: (
      <ul>
        <li>Anyone can sign up as a Public user. Journalist and Expert roles require accreditation.</li>
        <li>Give accurate information when you sign up or apply for accreditation.</li>
        <li>Keep one account per person, and keep your credentials confidential — you&apos;re responsible for activity under your account.</li>
        <li>Two-factor authentication is required for Expert and Admin accounts.</li>
      </ul>
    ),
  },
  {
    id: "submissions",
    title: "Your submissions",
    content: (
      <>
        <p>
          You must have the right to share whatever you submit for checking. Don&apos;t submit
          content that&apos;s illegal, that violates someone else&apos;s privacy, or that you don&apos;t
          have permission to share.
        </p>
        <p>
          Uploaded files are scanned for malware before analysis. A submission and the verdict Zuula
          reaches on it may be published as part of the public fact-check record, in the same way a
          newsroom publishes what it fact-checks.
        </p>
      </>
    ),
  },
  {
    id: "ratings",
    title: "Community ratings and conduct",
    content: (
      <p>
        Rate verdicts honestly, based on the evidence shown. Coordinated or manipulated rating
        activity (for example, groups of accounts rating together to push a verdict&apos;s score) can
        have its ratings discounted and the accounts involved suspended. You can report content or
        ratings that look manipulated from the report page.
      </p>
    ),
  },
  {
    id: "api",
    title: "API and developer access",
    content: (
      <p>
        Journalist and Admin accounts can request API keys from{" "}
        <Link href="/account/api-access">Account &rarr; API Keys</Link>. Partner API access is rate
        limited (currently 100 requests/hour) and keys are tied to your account &mdash; don&apos;t
        share them. See the <Link href="/developers">developer page</Link> for details.
      </p>
    ),
  },
  {
    id: "ip",
    title: "Intellectual property",
    content: (
      <p>
        The Zuula name, mark and interface belong to the Centre for Intelligent Technologies,
        Victoria University Kampala. You&apos;re welcome to share, screenshot and cite Zuula&apos;s
        published verdicts with attribution and a link back to the report.
      </p>
    ),
  },
  {
    id: "disclaimer",
    title: "Accuracy and limitation of liability",
    content: (
      <p>
        We check every claim in good faith and publish the evidence behind each verdict, but we
        don&apos;t guarantee any verdict is error-free. To the extent permitted by the laws of
        Uganda, Zuula and Victoria University CIT aren&apos;t liable for decisions made in reliance
        on a verdict.
      </p>
    ),
  },
  {
    id: "termination",
    title: "Suspension and termination",
    content: (
      <p>
        We may suspend or close an account for abuse, manipulated ratings, or breaking these terms.
        You can close your own account at any time from Account settings.
      </p>
    ),
  },
  {
    id: "law",
    title: "Governing law",
    content: <p>These terms are governed by the laws of the Republic of Uganda.</p>,
  },
  {
    id: "changes",
    title: "Changes to these terms",
    content: (
      <p>
        We may update these terms as the platform develops. We&apos;ll update the date above when we
        do; continuing to use Zuula after a change means you accept the updated terms.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    content: (
      <p>
        Questions about these terms? Email <a href="mailto:hello@zuula.ug">hello@zuula.ug</a>. See
        also our <Link href="/legal/privacy">Privacy Policy</Link>.
      </p>
    ),
  },
]

export default function TermsPage() {
  return (
    <div className="page-container flex flex-col gap-10 py-10">
      <PageHeader
        title="Terms"
        description="The terms that govern using Zuula."
        actions={<Badge variant="outline">Last updated {LAST_UPDATED}</Badge>}
      />
      <ArticleSections sections={SECTIONS} />
    </div>
  )
}
