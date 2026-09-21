"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { RiFlaskLine, RiMailSendLine } from "@remixicon/react"
import { useTranslations } from "next-intl"
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
import { useValidationMessage } from "@/hooks/use-validation-message"
import { clearPendingAuth, identifierKind, isDemoCodeValid, maskIdentifier } from "@/lib/auth"

// FR-AUTH-03: confirm the email or phone number with a one-time code.
export function VerifyAccountForm() {
  const router = useRouter()
  const { signInAs } = useSession()
  const t = useTranslations("Auth")
  const v = useValidationMessage()
  const pending = usePendingAuth()
  const [code, setCode] = React.useState("")
  // A Validation.* key.
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  if (pending === undefined) return <Skeleton className="h-80 w-full" />
  if (pending === null) {
    return (
      <div className="flex flex-col gap-4">
        <AuthHeading title={t("verify.nothingTitle")} description={t("verify.nothingBody")} />
        <Button asChild className="w-fit">
          <Link href="/sign-up">{t("verify.startSignUp")}</Link>
        </Button>
      </div>
    )
  }

  const destination = maskIdentifier(pending.identifier)
  const channel = identifierKind(pending.identifier) === "phone" ? "sms" : "email"

  async function verify(value = code) {
    if (value.length < 6) {
      setError("codeAllDigits")
      return
    }
    setBusy(true)
    setError(null)
    await new Promise((r) => setTimeout(r, 500))
    if (!isDemoCodeValid(value)) {
      setBusy(false)
      setError("codeInvalid")
      setCode("")
      return
    }
    clearPendingAuth()
    signInAs("public")
    const firstName = pending?.name?.split(" ")[0]
    toast.success(firstName ? t("verify.welcomeName", { name: firstName }) : t("verify.welcome"), {
      description: t("verify.ready"),
    })
    startNavigationProgress()
    router.push(pending?.next ?? "/")
  }

  return (
    <div className="flex flex-col gap-6">
      <AuthHeading
        icon={RiMailSendLine}
        title={t("verify.title")}
        description={t.rich("verify.sentTo", {
          channel,
          destination,
          strong: (chunks) => <span className="font-medium text-foreground">{chunks}</span>,
        })}
      />
      <Alert>
        <RiFlaskLine aria-hidden />
        <AlertDescription>{t("demo.code")}</AlertDescription>
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
          <FieldLabel htmlFor="verify-code">{t("verify.codeLabel")}</FieldLabel>
          <CodeInput
            id="verify-code"
            value={code}
            onChange={(next) => {
              setCode(next)
              if (error) setError(null)
            }}
            onComplete={(next) => void verify(next)}
            invalid={!!error}
            disabled={busy}
            describedBy={error ? "verify-code-error" : undefined}
          />
          {error && <FieldError id="verify-code-error">{v(error)}</FieldError>}
        </Field>
        <Button type="submit" size="lg" className="h-10" disabled={busy}>
          {busy && <Spinner />}
          {busy ? t("verify.submitting") : t("verify.submit")}
        </Button>
      </form>
      <div className="flex flex-col gap-1">
        <ResendCode destination={destination} />
        <p className="text-sm text-muted-foreground">
          {t("verify.wrongAddress")}{" "}
          <Link href="/sign-up" className="text-primary underline-offset-4 hover:underline">
            {t("verify.goBack")}
          </Link>
        </p>
      </div>
    </div>
  )
}
