"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { RiFlaskLine, RiShieldKeyholeLine } from "@remixicon/react"
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
import { ROLE_LABELS } from "@/lib/roles"

const BACKUP_PATTERN = /^[A-Z0-9]{4}-?[A-Z0-9]{4}$/

// FR-AUTH-05: second factor for Expert Reviewers and Administrators.
export function TwoFactorForm() {
  const router = useRouter()
  const { signInAs } = useSession()
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
        <AuthHeading title="Sign in first" description="Two-factor authentication follows your password sign-in." />
        <Button asChild className="w-fit">
          <Link href="/sign-in">Go to sign in</Link>
        </Button>
      </div>
    )
  }

  async function submit(value?: string) {
    const valid =
      mode === "app" ? isDemoCodeValid(value ?? code) : BACKUP_PATTERN.test(backup.trim().toUpperCase())
    if (mode === "app" && (value ?? code).length < 6) {
      setError("Enter all 6 digits.")
      return
    }
    setBusy(true)
    setError(null)
    await new Promise((r) => setTimeout(r, 500))
    if (!valid) {
      setBusy(false)
      setError(mode === "app" ? "That code is incorrect. Codes change every 30 seconds." : "That backup code isn't valid.")
      setCode("")
      return
    }
    const role = pending!.role
    clearPendingAuth()
    signInAs(role)
    toast.success("Signed in", {
      description: `${ROLE_LABELS[role]}${trust ? " · this device is trusted for 30 days" : ""}`,
    })
    startNavigationProgress()
    router.push(pending!.next)
  }

  return (
    <div className="flex flex-col gap-6">
      <AuthHeading
        icon={RiShieldKeyholeLine}
        title="Two-factor authentication"
        description={
          mode === "app"
            ? "Enter the 6-digit code from your authenticator app."
            : "Enter one of the backup codes you saved when you set up two-factor."
        }
      />
      <Alert>
        <RiFlaskLine aria-hidden />
        <AlertDescription>
          Demo: any 6 digits work except 000000. Backup codes look like ABCD-1234.
        </AlertDescription>
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
            <FieldLabel htmlFor="tfa-code">Authentication code</FieldLabel>
            <CodeInput
              id="tfa-code"
              value={code}
              onChange={(v) => {
                setCode(v)
                if (error) setError(null)
              }}
              onComplete={(v) => void submit(v)}
              invalid={!!error}
              disabled={busy}
              describedBy={error ? "tfa-error" : undefined}
            />
            {error && <FieldError id="tfa-error">{error}</FieldError>}
          </Field>
        ) : (
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor="tfa-backup">Backup code</FieldLabel>
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
            <FieldDescription>Each backup code works once.</FieldDescription>
            {error && <FieldError>{error}</FieldError>}
          </Field>
        )}

        <Field orientation="horizontal">
          <Checkbox id="tfa-trust" checked={trust} onCheckedChange={(c) => setTrust(c === true)} />
          <FieldLabel htmlFor="tfa-trust" className="font-normal">
            Trust this device for 30 days
          </FieldLabel>
        </Field>

        <Button type="submit" size="lg" className="h-10" disabled={busy}>
          {busy && <Spinner />}
          {busy ? "Checking…" : "Continue"}
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
          {mode === "app" ? "Use a backup code instead" : "Use your authenticator app"}
        </Button>
        <p>
          Lost access to both?{" "}
          <Link href="/about#contact" className="text-primary underline-offset-4 hover:underline">
            Contact an administrator
          </Link>
        </p>
      </div>
    </div>
  )
}
