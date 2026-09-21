"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { RiFlaskLine, RiMailSendLine } from "@remixicon/react"
import { toast } from "sonner"

import { AuthHeading } from "@/components/auth/auth-heading"
import { CodeInput } from "@/components/auth/code-input"
import { ResendCode } from "@/components/auth/resend-code"
import { usePendingAuth } from "@/components/auth/use-pending-auth"
import { useSession } from "@/components/providers/session-provider"
import { startNavigationProgress } from "@/components/shell/route-progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { clearPendingAuth, identifierKind, isDemoCodeValid, maskIdentifier } from "@/lib/auth"

// FR-AUTH-03: confirm the email or phone number with a one-time code.
export function VerifyAccountForm() {
  const router = useRouter()
  const { signInAs } = useSession()
  const pending = usePendingAuth()
  const [code, setCode] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  if (pending === undefined) return <Skeleton className="h-80 w-full" />
  if (pending === null) {
    return (
      <div className="flex flex-col gap-4">
        <AuthHeading title="Nothing to verify" description="Your sign-up session has expired or was started on another device." />
        <Button asChild className="w-fit">
          <Link href="/sign-up">Start sign-up</Link>
        </Button>
      </div>
    )
  }

  const destination = maskIdentifier(pending.identifier)
  const channel = identifierKind(pending.identifier) === "phone" ? "SMS" : "email"

  async function verify(value = code) {
    if (value.length < 6) {
      setError("Enter all 6 digits.")
      return
    }
    setBusy(true)
    setError(null)
    await new Promise((r) => setTimeout(r, 500))
    if (!isDemoCodeValid(value)) {
      setBusy(false)
      setError("That code is incorrect or has expired.")
      setCode("")
      return
    }
    clearPendingAuth()
    signInAs("public")
    toast.success(`Welcome to Zuula${pending?.name ? `, ${pending.name.split(" ")[0]}` : ""}!`, {
      description: "Your account is ready.",
    })
    startNavigationProgress()
    router.push(pending?.next ?? "/")
  }

  return (
    <div className="flex flex-col gap-6">
      <AuthHeading
        icon={RiMailSendLine}
        title="Verify your account"
        description={
          <>
            We sent a 6-digit code by {channel} to <span className="font-medium text-foreground">{destination}</span>.
          </>
        }
      />
      <Alert>
        <RiFlaskLine aria-hidden />
        <AlertDescription>Demo: any 6 digits work, except 000000.</AlertDescription>
      </Alert>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          void verify()
        }}
        className="flex flex-col gap-4"
      >
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor="verify-code">Verification code</FieldLabel>
          <CodeInput
            id="verify-code"
            value={code}
            onChange={(v) => {
              setCode(v)
              if (error) setError(null)
            }}
            onComplete={(v) => void verify(v)}
            invalid={!!error}
            disabled={busy}
            describedBy={error ? "verify-code-error" : undefined}
          />
          {error && <FieldError id="verify-code-error">{error}</FieldError>}
        </Field>
        <Button type="submit" size="lg" className="h-10" disabled={busy}>
          {busy && <Spinner />}
          {busy ? "Verifying…" : "Verify"}
        </Button>
      </form>
      <div className="flex flex-col gap-1">
        <ResendCode destination={destination} />
        <p className="text-sm text-muted-foreground">
          Wrong address?{" "}
          <Link href="/sign-up" className="text-primary underline-offset-4 hover:underline">
            Go back
          </Link>
        </p>
      </div>
    </div>
  )
}
