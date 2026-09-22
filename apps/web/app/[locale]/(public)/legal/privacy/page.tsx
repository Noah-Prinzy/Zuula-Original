import Link from "next/link"

import { ArticleSections, type ArticleSection } from "@/components/shell/article-sections"
import { PageHeader } from "@/components/shell/page-header"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Privacy",
  description: "How Zuula collects, uses and protects your data.",
}

const LAST_UPDATED = "21 September 2026"

const SECTIONS: ArticleSection[] = [
  {
    id: "overview",
    title: "Overview",
    content: (
      <p>
        This policy explains what Zuula collects when you check a claim, browse the Library or
        create an account, and how that information is used and protected under the{" "}
        <strong>Data Protection and Privacy Act, 2019</strong> of Uganda. It applies to the Zuula
        website and, once launched, the WhatsApp and Telegram bots and partner API.
      </p>
    ),
  },
  {
    id: "collect",
    title: "Information we collect",
    content: (
      <ul>
        <li><strong>Account details</strong> — name, email or phone number, and role (Public, Journalist, Expert or Admin).</li>
        <li><strong>Submissions</strong> — the text, link or media you ask Zuula to check, and the tracking ID it&apos;s given.</li>
        <li><strong>Ratings and reports</strong> — the verdicts you rate, comments you leave, and content you flag for moderation.</li>
        <li><strong>Accreditation documents</strong> — for Journalist and Expert applications, the credentials you provide for review.</li>
        <li><strong>Device and usage information</strong> — pages visited, browser type and rough location, to keep the service secure and working.</li>
      </ul>
    ),
  },
  {
    id: "use",
    title: "How we use it",
    content: (
      <ul>
        <li>To run the claim through our detection pipeline and show you its status and verdict.</li>
        <li>To weight and combine community ratings into a Community Confidence Score.</li>
        <li>To review Journalist and Expert accreditation, and to record reviewer decisions in an audit log.</li>
        <li>To detect coordinated or manipulated rating activity and protect the platform from abuse.</li>
        <li>To measure and improve verdict accuracy over time.</li>
      </ul>
    ),
  },
  {
    id: "ai-sharing",
    title: "AI analysis and third parties",
    content: (
      <>
        <p>
          Checking a claim can involve sending its text, or a transcription of its audio or video,
          to automated detection models and, for evidence retrieval, to a hosted AI provider. Media
          you upload is scanned for malware before it&apos;s processed.
        </p>
        <p>
          Because some of these providers may process data outside Uganda, we are reviewing this
          data flow against the Data Protection and Privacy Act, 2019 before it is enabled outside
          the current mock-data build. This section will be updated once that review is complete.
        </p>
      </>
    ),
  },
  {
    id: "dppa",
    title: "Your rights under the Data Protection and Privacy Act, 2019",
    content: (
      <>
        <p>As a data subject under Ugandan law, you have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you.</li>
          <li>Correct inaccurate or incomplete data.</li>
          <li>Request deletion of your account data, subject to our retention obligations below.</li>
          <li>Object to, or ask us to restrict, certain processing.</li>
          <li>
            Lodge a complaint with Uganda&apos;s Personal Data Protection Office (National
            Information Technology Authority-Uganda) if you believe we&apos;ve mishandled your data.
          </li>
        </ul>
        <p>
          To exercise any of these rights, contact us using the details in{" "}
          <a href="#contact">Contact &amp; data requests</a> below.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    content: (
      <p>
        Published verdicts and their evidence form part of the public fact-check record and are
        kept indefinitely, in the same way a news archive is. Account details are kept while your
        account is active and for a limited period afterwards, to support audit and accreditation
        records required for the review process. Malware-scanned upload copies are retained only as
        long as needed to produce a verdict.
      </p>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and local storage",
    content: (
      <p>
        We use a session cookie to keep you signed in, and local storage to remember your theme and
        language preference on this device. We don&apos;t use third-party advertising trackers.
      </p>
    ),
  },
  {
    id: "children",
    title: "Children's privacy",
    content: (
      <p>
        Zuula is intended for users aged 18 and over. We don&apos;t knowingly collect personal data
        from children, and will delete any we become aware of.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    content: (
      <p>
        We&apos;ll update the date at the top of this page whenever this policy changes, and post
        material changes on the <Link href="/">homepage</Link> before they take effect.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact & data requests",
    content: (
      <p>
        Email <a href="mailto:privacy@zuula.ug">privacy@zuula.ug</a> for any question about this
        policy or to exercise your rights under the Data Protection and Privacy Act, 2019. See also
        our <Link href="/legal/terms">Terms of use</Link>.
      </p>
    ),
  },
]

export default function PrivacyPage() {
  return (
    <div className="page-container flex flex-col gap-10 py-10">
      <PageHeader
        title="Privacy"
        description="How we collect, use and protect your data."
        actions={<Badge variant="outline">Last updated {LAST_UPDATED}</Badge>}
      />
      <ArticleSections sections={SECTIONS} />
    </div>
  )
}
