"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { RiSearchLine } from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { normaliseTrackingId, TRACKING_ID_PATTERN } from "@/lib/analysis"
import { cn } from "@/lib/utils"

// Look up a submission by tracking ID (for anonymous submitters returning later).
export function TrackingLookup({ className, defaultValue = "" }: { className?: string; defaultValue?: string }) {
  const router = useRouter()
  const [value, setValue] = React.useState(defaultValue)
  const [error, setError] = React.useState<string | null>(null)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const id = normaliseTrackingId(value)
    if (!TRACKING_ID_PATTERN.test(id)) {
      setError("Tracking IDs look like ZL-7K3P-Q9.")
      return
    }
    setError(null)
    router.push(`/submissions/${id}`)
  }

  return (
    <form onSubmit={onSubmit} noValidate className={cn("flex flex-col gap-2", className)}>
      <Field data-invalid={!!error}>
        <FieldLabel htmlFor="tracking-id">Tracking ID</FieldLabel>
        <div className="flex gap-2">
          <Input
            id="tracking-id"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              if (error) setError(null)
            }}
            placeholder="ZL-XXXX-XX"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={!!error}
            className="font-mono uppercase"
          />
          <Button type="submit" variant="outline">
            <RiSearchLine aria-hidden />
            Track
          </Button>
        </div>
        {error ? (
          <FieldError>{error}</FieldError>
        ) : (
          <FieldDescription>You got this ID when you submitted.</FieldDescription>
        )}
      </Field>
    </form>
  )
}
