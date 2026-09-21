"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { RiFlaskLine, RiShieldKeyholeLine } from "@remixicon/react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { AuthHeading } from "@/components/auth/auth-heading"
import { CodeInput } from "@/components/auth/code-input"
import { usePendingAuth } from "@/components/auth/use-pending-auth"
import { useSession } from "@/components/providers/session-provider"
import { startNavigationProgress } from "@/components/shell/route-progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { clearPendingAuth, isDemoCodeValid, needsTwoFactor } from "@/lib/auth"

const BACKUP_PATTERN = /^[A-Z0-9]{4}-?[A-Z0-9]{4}$/

// FR-AUTH-05: second factor for Expert Reviewers and Administrators.
export function TwoFactorForm() {
  const router = useRouter()
  const { signInAs } = useSession()
  const t = useTranslations("Auth")
  const tv = useTranslations("Validation")
  const tr = useTranslations("Roles")
  const pending = usePendingAuth()
  const [mode, setMode] = React.useState<"app" | "backup">("app")
  const [code, setCode] = React.useState("")
  const [backup, setBackup] = React.useState("")
  const [trust, setTrust] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  if (pending === undefined) return <Skeleton className="h-80 w-full" />
  if (pending === null || !needsTwoFactor(pending.role)) {
    return (
      <div className="flex flex-col gap-4">
        <AuthHeading title={t("twoFactor.signInFirstTitle")} description={t("twoFactor.signInFirstBody")} />
        <Button asChild className="w-fit">
          <Link href="/sign-in">{t("twoFactor.goToSignIn")}</Link>
        </Button>
      </div>
    )
  }

  async function submit(value?: string) {
    const valid =
      mode === "app" ? isDemoCodeValid(value ?? code) : BACKUP_PATTERN.test(backup.trim().toUpperCase())
    if (mode === "app" && (value ?? code).length < 6) {
      setError(tv("codeAllDigits"))
      return
    }
    setBusy(true)
    setError(null)
    await new Promise((r) => setTimeout(r, 500))
    if (!valid) {
      setBusy(false)
      setError(mode === "app" ? t("twoFactor.wrongCode") : t("twoFactor.wrongBackup"))
      setCode("")
      return
    }
    const role = pending!.role
    clearPendingAuth()
    signInAs(role)
    toast.success(t("twoFactor.toastTitle"), {
      description: trust ? t("twoFactor.trusted", { role: tr(role) }) : tr(role),
    })
    startNavigationProgress()
    router.push(pending!.next)
  }

  return (
    <div className="flex flex-col gap-6">
      <AuthHeading
        icon={RiShieldKeyholeLine}
        title={t("twoFactor.title")}
        description={mode === "app" ? t("twoFactor.descriptionApp") : t("twoFactor.descriptionBackup")}
      />
      <Alert>
        <RiFlaskLine aria-hidden />
        <AlertDescription>{t("demo.twoFactor")}</AlertDescription>
      </Alert>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
        className="flex flex-col gap-4"
      >
        {mode === "app" ? (
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor="tfa-code">{t("twoFactor.codeLabel")}</FieldLabel>
            <CodeInput
              id="tfa-code"
              value={code}
              onChange={(next) => {
                setCode(next)
                if (error) setError(null)
              }}
              onComplete={(next) => void submit(next)}
              invalid={!!error}
              disabled={busy}
              describedBy={error ? "tfa-error" : undefined}
            />
            {error && <FieldError id="tfa-error">{error}</FieldError>}
          </Field>
        ) : (
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor="tfa-backup">{t("twoFactor.backupLabel")}</FieldLabel>
            <Input
              id="tfa-backup"
              value={backup}
              onChange={(e) => {
                setBackup(e.target.value)
                if (error) setError(null)
              }}
              placeholder="XXXX-XXXX"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={!!error}
              className="h-10 font-mono uppercase"
            />
            <FieldDescription>{t("twoFactor.backupHint")}</FieldDescription>
            {error && <FieldError>{error}</FieldError>}
          </Field>
        )}

        <Field orientation="horizontal">
          <Checkbox id="tfa-trust" checked={trust} onCheckedChange={(c) => setTrust(c === true)} />
          <FieldLabel htmlFor="tfa-trust" className="font-normal">
            {t("twoFactor.trust")}
          </FieldLabel>
        </Field>

        <Button type="submit" size="lg" className="h-10" disabled={busy}>
          {busy && <Spinner />}
          {busy ? t("twoFactor.submitting") : t("twoFactor.submit")}
        </Button>
      </form>

      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
        <Button
          type="button"
          variant="link"
          className="h-auto w-fit p-0"
          onClick={() => {
            setMode((m) => (m === "app" ? "backup" : "app"))
            setError(null)
          }}
        >
          {mode === "app" ? t("twoFactor.useBackup") : t("twoFactor.useApp")}
        </Button>
        <p>
          {t("twoFactor.lostAccess")}{" "}
          <Link href="/about#contact" className="text-primary underline-offset-4 hover:underline">
            {t("twoFactor.contactAdmin")}
          </Link>
        </p>
      </div>
    </div>
  )
}
