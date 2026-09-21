// SAMPLE DATA — fictional claims, articles and people for UI development only.
// Replaced by the API in Phase 3. Source URLs point to outlet home pages, not real articles.

import type { FactCheckReport } from "@/lib/types/fact-check"

const TEXT_1 =
  "BREAKING: The Ministry of ICT has announced that every Ugandan will get free unlimited internet from January 2027. All you need to do is register your National ID number on the link below before Friday. The programme is fully funded by the World Bank and has already been approved by Parliament. Share this with everyone in your family!"

function span(text: string, phrase: string) {
  const start = text.indexOf(phrase)
  if (start < 0) throw new Error(`Phrase not found: ${phrase}`)
  return { start, end: start + phrase.length }
}

export const SAMPLE_REPORTS: FactCheckReport[] = [
  {
    id: "fc-2026-0142",
    trackingId: "ZL-7K3P-Q9",
    title: "“Free unlimited internet for every Ugandan from January 2027”",
    contentType: "text",
    language: "English",
    submittedText: TEXT_1,
    verdict: "false",
    confidence: 92,
    summary:
      "No free national internet programme has been announced. The message matches a known phishing pattern that asks people to submit their National ID number through an unofficial link.",
    whatIsFalse: [
      "There is no announcement of free unlimited internet for all citizens from January 2027.",
      "There is no World Bank-funded programme of this kind approved by Parliament.",
    ],
    whatIsTrue: [
      "The government runs a separate programme expanding public Wi-Fi in selected towns.",
      "Official registration never asks for your National ID number through a shared link.",
    ],
    claims: [
      {
        id: "c1",
        ...span(TEXT_1, "every Ugandan will get free unlimited internet from January 2027"),
        assessment: "false",
        reason:
          "No official statement or policy document announces free unlimited internet for all citizens.",
        citationIds: ["s1", "s2"],
      },
      {
        id: "c2",
        ...span(TEXT_1, "register your National ID number on the link below"),
        assessment: "misleading",
        reason:
          "Government services do not collect ID numbers through forwarded links. This matches a common phishing pattern.",
        citationIds: ["s3"],
      },
      {
        id: "c3",
        ...span(TEXT_1, "fully funded by the World Bank and has already been approved by Parliament"),
        assessment: "unsupported",
        reason: "No funding agreement or parliamentary record supports this claim.",
        citationIds: ["s4"],
      },
    ],
    citations: [
      {
        id: "s1",
        sourceName: "Ministry of ICT (sample)",
        title: "Statement on public Wi-Fi expansion (sample)",
        url: "https://ict.go.ug",
        publishedAt: "2026-09-12",
        stance: "contradicts",
        trusted: true,
        excerpt: "The programme covers public Wi-Fi hotspots in selected municipalities.",
      },
      {
        id: "s2",
        sourceName: "Daily Monitor (sample)",
        title: "What the public Wi-Fi rollout does and does not include (sample)",
        url: "https://www.monitor.co.ug",
        publishedAt: "2026-09-14",
        stance: "contradicts",
        trusted: true,
      },
      {
        id: "s3",
        sourceName: "Uganda Communications Commission (sample)",
        title: "Consumer alert: messages asking for ID numbers (sample)",
        url: "https://www.ucc.co.ug",
        publishedAt: "2026-08-30",
        stance: "contradicts",
        trusted: true,
      },
      {
        id: "s4",
        sourceName: "Parliament of Uganda (sample)",
        title: "Order paper, September 2026 (sample)",
        url: "https://www.parliament.go.ug",
        publishedAt: "2026-09-10",
        stance: "context",
        trusted: true,
      },
    ],
    aiSignals: [
      {
        id: "a1",
        label: "Perplexity score",
        description:
          "How predictable the wording is to a language model. Very predictable text is more likely machine-written.",
        score: 0.34,
        threshold: 0.7,
        method: "Perplexity + RoBERTa classifier",
      },
      {
        id: "a2",
        label: "Template similarity",
        description: "Similarity to known viral hoax templates in the Zuula corpus.",
        score: 0.88,
        threshold: 0.75,
        method: "Vector similarity search",
      },
    ],
    annotations: [
      {
        id: "e1",
        author: "David Okello",
        role: "Expert Reviewer",
        createdAt: "2026-09-19",
        body: "Confirmed with the Ministry's communications office. Variants of this message are circulating on WhatsApp in Luganda and English.",
      },
    ],
    humanReview: {
      outcome: "confirmed",
      reviewer: "David Okello",
      reviewedAt: "2026-09-19",
      justification: "Verified with the Ministry. No such programme exists.",
    },
    category: "Technology",
    checkedAt: "2026-09-18",
    processingSeconds: 6.4,
  },
  {
    id: "fc-2026-0157",
    trackingId: "ZL-2M8D-R4",
    title: "Photo of flooded Kampala road shared as “today”",
    contentType: "image",
    language: "English",
    submittedText:
      "Kampala-Entebbe Expressway completely underwater this morning. Avoid the route!",
    verdict: "ai-generated",
    confidence: 87,
    summary:
      "The image shows strong signs of AI generation: inconsistent lighting, distorted road signs and no camera metadata. No reports of flooding on the route match the claimed date.",
    whatIsFalse: ["The photo was not taken on the expressway on the claimed date."],
    whatIsTrue: ["Heavy rain was reported in parts of Kampala that week, without closures on the expressway."],
    claims: [],
    citations: [
      {
        id: "s1",
        sourceName: "Uganda National Roads Authority (sample)",
        title: "Road status update (sample)",
        url: "https://www.unra.go.ug",
        publishedAt: "2026-09-20",
        stance: "contradicts",
        trusted: true,
      },
      {
        id: "s2",
        sourceName: "Uganda National Meteorological Authority (sample)",
        title: "Weekly weather summary (sample)",
        url: "https://www.unma.go.ug",
        publishedAt: "2026-09-19",
        stance: "context",
        trusted: true,
      },
      {
        id: "s3",
        sourceName: "Nile Post (sample)",
        title: "No closures reported on major routes (sample)",
        url: "https://nilepost.co.ug",
        publishedAt: "2026-09-20",
        stance: "contradicts",
        trusted: true,
      },
    ],
    aiSignals: [
      {
        id: "a1",
        label: "Deepfake image classifier",
        description: "Probability that the image was generated or heavily edited by an AI model.",
        score: 0.91,
        threshold: 0.7,
        method: "CNNDetection model",
      },
      {
        id: "a2",
        label: "Metadata anomalies",
        description: "The file has no camera EXIF data and an editing-software signature.",
        score: 0.82,
        threshold: 0.6,
        method: "EXIF analysis",
      },
      {
        id: "a3",
        label: "Reverse image match",
        description: "Similar images found online before the claimed date.",
        score: 0.41,
        threshold: 0.6,
        method: "Perceptual hash search",
      },
    ],
    annotations: [],
    category: "Weather",
    checkedAt: "2026-09-20",
    processingSeconds: 38.2,
  },
]

export function getSampleReport(id: string) {
  return SAMPLE_REPORTS.find((r) => r.id === id)
}
