import {
  RiGlobalLine,
  RiRobot2Line,
  RiShieldCheckLine,
} from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"

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

export default function HomePage() {
  return (
    <>
      <section className="border-b bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-16 text-center md:py-24">
          <Badge variant="outline">Uganda Fact-Guard · Victoria University CIT</Badge>
          <h1 className="max-w-3xl font-heading text-4xl font-bold tracking-tight text-balance md:text-5xl">
            Check a claim before you share it
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground text-balance md:text-lg">
            Paste a message, a link or upload media. Zuula tells you whether it is authentic, false
            or AI-generated — and shows you the sources.
          </p>

          {/* SubmissionComposer lands here in Week 2. */}
          <Empty className="mt-4 w-full max-w-3xl border border-dashed bg-background">
            <EmptyHeader>
              <EmptyTitle>Submission composer</EmptyTitle>
              <EmptyDescription>
                Text, link, media and article input with language selection (FR-SUBMIT).
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-12 md:grid-cols-3">
        {FEATURES.map((f) => (
          <Card key={f.title}>
            <CardHeader>
              <f.icon className="size-6 text-primary" aria-hidden />
              <CardTitle className="font-heading">{f.title}</CardTitle>
              <CardDescription>{f.body}</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </section>
    </>
  )
}
