"use client"

import * as React from "react"
import { RiCheckLine, RiFileCopyLine } from "@remixicon/react"
import { useTranslations } from "next-intl"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

function CopyButton({ code }: { code: string }) {
  const t = useTranslations("Developers.code")
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(id)
  }, [copied])

  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(code).then(() => setCopied(true))}
      className="press inline-flex shrink-0 items-center gap-1 px-3 py-2 text-xs text-zinc-400 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-ring"
    >
      {copied ? (
        <RiCheckLine className="size-3.5" aria-hidden />
      ) : (
        <RiFileCopyLine className="size-3.5" aria-hidden />
      )}
      <span aria-live="polite">{copied ? t("copied") : t("copy")}</span>
    </button>
  )
}

// Scrollable, so it must be reachable by keyboard to scroll it (WCAG 2.1.1).
function Pre({ code }: { code: string }) {
  return (
    <pre
      tabIndex={0}
      className="max-h-[28rem] overflow-auto p-4 font-mono text-[0.8125rem] leading-relaxed text-zinc-100">
      <code>{code}</code>
    </pre>
  )
}

// A dark code panel with a label and a copy button. Stays dark in both themes.
export function CodeBlock({ code, label, className }: { code: string; label?: string; className?: string }) {
  return (
    <div className={cn("min-w-0 border border-zinc-800 bg-zinc-950", className)}>
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pl-4">
        <span className="truncate font-mono text-xs text-zinc-400">{label}</span>
        <CopyButton code={code} />
      </div>
      <Pre code={code} />
    </div>
  )
}

const LANGUAGES = [
  { value: "curl", label: "cURL" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
] as const

export type Samples = Record<(typeof LANGUAGES)[number]["value"], string>

// The same request in several languages.
export function CodeSamples({ samples, className }: { samples: Samples; className?: string }) {
  const [lang, setLang] = React.useState<keyof Samples>("curl")

  return (
    <Tabs
      value={lang}
      onValueChange={(v) => setLang(v as keyof Samples)}
      className={cn("min-w-0 gap-0 border border-zinc-800 bg-zinc-950", className)}
    >
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800">
        <TabsList variant="line" className="h-9 bg-transparent px-2">
          {LANGUAGES.map((l) => (
            <TabsTrigger
              key={l.value}
              value={l.value}
              className="font-mono text-xs text-zinc-400 hover:text-zinc-100 data-active:text-white dark:data-active:text-white"
            >
              {l.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <CopyButton code={samples[lang]} />
      </div>
      {LANGUAGES.map((l) => (
        <TabsContent key={l.value} value={l.value}>
          <Pre code={samples[l.value]} />
        </TabsContent>
      ))}
    </Tabs>
  )
}
