"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { RiSearchLine } from "@remixicon/react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { normaliseTrackingId, TRACKING_ID_PATTERN } from "@/lib/analysis"
import { cn } from "@/lib/utils"

// Look up a submission by tracking ID (for anonymous submitters returning later).
export function TrackingLookup({ className, defaultValue = "" }: { className?: string; defaultValue?: string }) {
  const t = useTranslations("Status.lookup")
  const router = useRouter()
  const [value, setValue] = React.useState(defaultValue)
  const [error, setError] = React.useState<string | null>(null)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const id = normaliseTrackingId(value)
    if (!TRACKING_ID_PATTERN.test(id)) {
      setError(t("invalid"))
      return
    }
    setError(null)
    router.push(`/submissions/${id}`)
  }

  return (
    <form onSubmit={onSubmit} noValidate className={cn("flex flex-col gap-2", className)}>
      <Field data-invalid={!!error}>
        <FieldLabel htmlFor="tracking-id">{t("label")}</FieldLabel>
        <div className="flex gap-2">
          <Input
            id="tracking-id"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              if (error) setError(null)
            }}
            placeholder={t("placeholder")}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={!!error}
            className="font-mono uppercase"
          />
          <Button type="submit" variant="outline">
            <RiSearchLine aria-hidden />
            {t("track")}
          </Button>
        </div>
        {error ? (
          <FieldError>{error}</FieldError>
        ) : (
          <FieldDescription>{t("hint")}</FieldDescription>
        )}
      </Field>
    </form>
  )
}
