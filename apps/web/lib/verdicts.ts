import {
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiErrorWarningFill,
  RiQuestionFill,
  RiRobot2Fill,
  type RemixiconComponentType,
} from "@remixicon/react"

import type { ClaimAssessment, CitationStance, Verdict } from "@/lib/types/fact-check"

type VerdictMeta = {
  label: string
  description: string
  icon: RemixiconComponentType
  /** Tailwind classes; colour tokens live in globals.css. */
  text: string
  bg: string
  border: string
  stroke: string
  decoration: string
  solid: string
}

export const VERDICT_META: Record<Verdict, VerdictMeta> = {
  authentic: {
    label: "Authentic",
    description: "Supported by trusted sources.",
    icon: RiCheckboxCircleFill,
    text: "text-verdict-authentic",
    bg: "bg-verdict-authentic/10",
    border: "border-verdict-authentic/40",
    stroke: "stroke-verdict-authentic",
    decoration: "decoration-verdict-authentic",
    solid: "bg-verdict-authentic",
  },
  "likely-false": {
    label: "Likely False",
    description: "Key claims are contradicted or lack support.",
    icon: RiErrorWarningFill,
    text: "text-verdict-likely-false",
    bg: "bg-verdict-likely-false/10",
    border: "border-verdict-likely-false/40",
    stroke: "stroke-verdict-likely-false",
    decoration: "decoration-verdict-likely-false",
    solid: "bg-verdict-likely-false",
  },
  false: {
    label: "False",
    description: "Contradicted by trusted sources.",
    icon: RiCloseCircleFill,
    text: "text-verdict-false",
    bg: "bg-verdict-false/10",
    border: "border-verdict-false/40",
    stroke: "stroke-verdict-false",
    decoration: "decoration-verdict-false",
    solid: "bg-verdict-false",
  },
  "ai-generated": {
    label: "AI-Generated",
    description: "Shows strong signs of being created or altered by AI.",
    icon: RiRobot2Fill,
    text: "text-verdict-ai-generated",
    bg: "bg-verdict-ai-generated/10",
    border: "border-verdict-ai-generated/40",
    stroke: "stroke-verdict-ai-generated",
    decoration: "decoration-verdict-ai-generated",
    solid: "bg-verdict-ai-generated",
  },
  unverifiable: {
    label: "Unverifiable",
    description: "Not enough reliable evidence either way.",
    icon: RiQuestionFill,
    text: "text-verdict-unverifiable",
    bg: "bg-verdict-unverifiable/10",
    border: "border-verdict-unverifiable/40",
    stroke: "stroke-verdict-unverifiable",
    decoration: "decoration-verdict-unverifiable",
    solid: "bg-verdict-unverifiable",
  },
}

export const CLAIM_META: Record<ClaimAssessment, { label: string; verdict: Verdict }> = {
  false: { label: "False", verdict: "false" },
  misleading: { label: "Misleading", verdict: "likely-false" },
  unsupported: { label: "Unsupported", verdict: "unverifiable" },
  "out-of-context": { label: "Out of context", verdict: "likely-false" },
  supported: { label: "Supported", verdict: "authentic" },
}

export const STANCE_META: Record<CitationStance, { label: string; verdict: Verdict }> = {
  supports: { label: "Supports", verdict: "authentic" },
  contradicts: { label: "Contradicts", verdict: "false" },
  context: { label: "Context", verdict: "unverifiable" },
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}
