"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  RiComputerLine,
  RiDeleteBin6Line,
  RiDownload2Line,
  RiShieldCheckLine,
  RiSmartphoneLine,
} from "@remixicon/react"
import { toast } from "sonner"

import { PasswordInput } from "@/components/auth/password-input"
import { PasswordStrength } from "@/components/auth/password-strength"
import { CodeInput } from "@/components/auth/code-input"
import { SettingsSection } from "@/components/account/settings-section"
import { useSession } from "@/components/providers/session-provider"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Switch } from "@/components/ui/switch"
import { identifierKind, isDemoCodeValid, PASSWORD_MIN, passwordStrength } from "@/lib/auth"
import { LOCALES, type LocaleCode } from "@/lib/locales"
import { SAMPLE_RATINGS, SAMPLE_SESSIONS, SAMPLE_SUBMISSIONS } from "@/lib/mock/account"
import { ROLE_LABELS } from "@/lib/roles"
import { initials } from "@/lib/utils"

function DetailsSection() {
  const { user, locale, setLocale } = useSession()
  const [name, setName] = React.useState(user?.name ?? "")
  const [email, setEmail] = React.useState(user?.email ?? "")
  const [phone, setPhone] = React.useState("")
  const [district, setDistrict] = React.useState("Kampala")
  const [lang, setLang] = React.useState<LocaleCode>(locale)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  function save(e: React.FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (name.trim().length < 2) next.name = "Enter your full name."
    if (email && identifierKind(email) !== "email") next.email = "Enter a valid email address."
    if (phone && identifierKind(phone) !== "phone") next.phone = "Enter a Ugandan number like 07XX XXX XXX."
    if (!email && !phone) next.email = "Add an email or a phone number."
    setErrors(next)
    if (Object.keys(next).length) return
    setLocale(lang)
    toast.success("Profile saved")
  }

  return (
    <form noValidate onSubmit={save} className="contents">
      <SettingsSection
        id="details"
        title="Your details"
        description="Shown with your ratings and comments. Your email and phone are never public."
        footer={<Button type="submit">Save changes</Button>}
      >
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            <AvatarFallback className="text-base">{initials(name || "?")}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{name || "—"}</span>
            {user && (
              <Badge variant="outline" className="w-fit">
                {ROLE_LABELS[user.role]}
              </Badge>
            )}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.name} className="sm:col-span-2">
            <FieldLabel htmlFor="profile-name">Full name</FieldLabel>
            <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" aria-invalid={!!errors.name} />
            {errors.name && <FieldError>{errors.name}</FieldError>}
          </Field>
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="profile-email">Email</FieldLabel>
            <Input id="profile-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" aria-invalid={!!errors.email} />
            {errors.email && <FieldError>{errors.email}</FieldError>}
          </Field>
          <Field data-invalid={!!errors.phone}>
            <FieldLabel htmlFor="profile-phone">Phone (for SMS alerts)</FieldLabel>
            <Input id="profile-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="07XX XXX XXX" aria-invalid={!!errors.phone} />
            {errors.phone && <FieldError>{errors.phone}</FieldError>}
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-language">Preferred language</FieldLabel>
            <NativeSelect id="profile-language" className="w-full" value={lang} onChange={(e) => setLang(e.target.value as LocaleCode)}>
              {LOCALES.map((l) => (
                <NativeSelectOption key={l.code} value={l.code}>
                  {l.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldDescription>Used for the interface and for your alerts.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-district">District</FieldLabel>
            <Input id="profile-district" value={district} onChange={(e) => setDistrict(e.target.value)} />
            <FieldDescription>Helps us send you local alerts.</FieldDescription>
          </Field>
        </div>
      </SettingsSection>
    </form>
  )
}

function PasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [current, setCurrent] = React.useState("")
  const [next, setNext] = React.useState("")
  const [confirm, setConfirm] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  function reset() {
    setCurrent("")
    setNext("")
    setConfirm("")
    setError(null)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!current) return setError("Enter your current password.")
    if (next.length < PASSWORD_MIN || passwordStrength(next).score < 3)
      return setError(`Use at least ${PASSWORD_MIN} characters with letters, numbers and symbols.`)
    if (next !== confirm) return setError("New passwords don't match.")
    if (next === current) return setError("Choose a password you haven't used before.")
    onOpenChange(false)
    reset()
    toast.success("Password changed", { description: "Other devices have been signed out." })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <DialogContent>
        <form noValidate onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>You&apos;ll stay signed in here. Other devices will be signed out.</DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="pw-current">Current password</FieldLabel>
            <PasswordInput id="pw-current" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
          </Field>
          <Field>
            <FieldLabel htmlFor="pw-new">New password</FieldLabel>
            <PasswordInput id="pw-new" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" aria-describedby="pw-new-strength" />
            <PasswordStrength id="pw-new-strength" password={next} />
          </Field>
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor="pw-confirm">Confirm new password</FieldLabel>
            <PasswordInput id="pw-confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
            {error && <FieldError>{error}</FieldError>}
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Change password</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Placeholder setup key; the real one (and QR code) comes from the auth API.
const DEMO_SECRET = "JBSW Y3DP EHPK 3PXP"

function TwoFactorDialog({
  open,
  onOpenChange,
  onEnabled,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onEnabled: () => void
}) {
  const [code, setCode] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  function confirm(value = code) {
    if (!isDemoCodeValid(value)) {
      setError("That code didn't match. Check the time on your phone and try again.")
      setCode("")
      return
    }
    setCode("")
    setError(null)
    onEnabled()
    onOpenChange(false)
    toast.success("Two-factor authentication is on", { description: "Save your backup codes somewhere safe." })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set up two-factor authentication</DialogTitle>
          <DialogDescription>
            Add Zuula to an authenticator app (Google Authenticator, Microsoft Authenticator, Authy), then enter the
            6-digit code it shows.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 border bg-muted/40 p-3">
          <span className="text-xs text-muted-foreground">Setup key (enter it manually or scan the QR code once live)</span>
          <code className="font-mono text-lg tracking-widest">{DEMO_SECRET}</code>
        </div>
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor="tfa-setup-code">Code from your app</FieldLabel>
          <CodeInput
            id="tfa-setup-code"
            value={code}
            onChange={(v) => {
              setCode(v)
              if (error) setError(null)
            }}
            onComplete={confirm}
            invalid={!!error}
          />
          {error ? <FieldError>{error}</FieldError> : <FieldDescription>Demo: any 6 digits except 000000.</FieldDescription>}
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => confirm()}>Turn on</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SecuritySection() {
  const { role } = useSession()
  const required = role === "expert" || role === "admin"
  const [pwOpen, setPwOpen] = React.useState(false)
  const [tfaOpen, setTfaOpen] = React.useState(false)
  const [tfaOn, setTfaOn] = React.useState(required)
  const [sessions, setSessions] = React.useState(SAMPLE_SESSIONS)

  return (
    <SettingsSection id="security" title="Security" description="Protect your account and see where you're signed in.">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Password</p>
          <p className="text-xs text-muted-foreground">Last changed 3 months ago</p>
        </div>
        <Button variant="outline" onClick={() => setPwOpen(true)}>
          Change password
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <div className="flex flex-col gap-0.5">
          <label htmlFor="tfa-switch" className="flex items-center gap-2 text-sm font-medium">
            <RiShieldCheckLine className="size-4 text-primary" aria-hidden />
            Two-factor authentication
          </label>
          <p className="text-xs text-muted-foreground">
            {required
              ? `Required for ${ROLE_LABELS[role!]}s and always on.`
              : "Ask for a code from your phone when you sign in."}
          </p>
        </div>
        <Switch
          id="tfa-switch"
          checked={tfaOn}
          disabled={required}
          onCheckedChange={(on) => {
            if (on) setTfaOpen(true)
            else {
              setTfaOn(false)
              toast.info("Two-factor authentication is off")
            }
          }}
        />
      </div>

      <div className="flex flex-col gap-2 border-t pt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Signed-in devices</p>
          {sessions.length > 1 && (
            <Button
              variant="link"
              size="xs"
              className="px-0"
              onClick={() => {
                setSessions((s) => s.filter((d) => d.current))
                toast.success("Signed out of other devices")
              }}
            >
              Sign out of all others
            </Button>
          )}
        </div>
        <ul className="flex flex-col divide-y border">
          {sessions.map((d) => {
            const Icon = /android|iphone|app/i.test(d.device) ? RiSmartphoneLine : RiComputerLine
            return (
              <li key={d.id} className="flex items-center gap-3 p-3">
                <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm">
                    {d.device}
                    {d.current && <Badge variant="secondary" className="ml-2">This device</Badge>}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {d.location} · {d.lastActive}
                  </span>
                </div>
                {!d.current && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSessions((s) => s.filter((x) => x.id !== d.id))
                      toast.success(`Signed out of ${d.device}`)
                    }}
                  >
                    Sign out
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <PasswordDialog open={pwOpen} onOpenChange={setPwOpen} />
      <TwoFactorDialog open={tfaOpen} onOpenChange={setTfaOpen} onEnabled={() => setTfaOn(true)} />
    </SettingsSection>
  )
}

function DataSection() {
  const router = useRouter()
  const { user, signOut } = useSession()
  const [confirmText, setConfirmText] = React.useState("")

  // DPPA 2019 right of access: everything we hold about the user as a JSON file.
  function exportData() {
    const data = {
      exportedAt: new Date().toISOString(),
      profile: user,
      submissions: SAMPLE_SUBMISSIONS,
      ratings: SAMPLE_RATINGS,
      note: "Sample export. The real export is generated by the server.",
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "zuula-my-data.json"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Your data is downloading")
  }

  return (
    <SettingsSection
      id="your-data"
      title="Your data"
      description="Under the Data Protection and Privacy Act, 2019 you can download or delete your personal data at any time."
      tone="danger"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Download your data</p>
          <p className="text-xs text-muted-foreground">Profile, submissions, ratings and comments as a JSON file.</p>
        </div>
        <Button variant="outline" onClick={exportData}>
          <RiDownload2Line aria-hidden /> Download
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <div className="max-w-xl">
          <p className="text-sm font-medium">Delete your account</p>
          <p className="text-xs text-muted-foreground">
            Removes your profile and personal data. Your ratings stay as anonymous counts. Submitted content is
            anonymised after the 12-month audit period.
          </p>
        </div>
        <AlertDialog onOpenChange={(o) => !o && setConfirmText("")}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <RiDeleteBin6Line aria-hidden /> Delete account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This can&apos;t be undone. Type <strong>DELETE</strong> to confirm.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              aria-label="Type DELETE to confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={confirmText !== "DELETE"}
                className="bg-destructive text-white hover:bg-destructive/90"
                onClick={() => {
                  signOut()
                  toast.success("Account deleted", { description: "Your personal data has been removed." })
                  router.push("/")
                }}
              >
                Delete account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SettingsSection>
  )
}

export function ProfileSettings() {
  const { user, role } = useSession()
  // Re-initialise the forms once the session is known (it loads after first render).
  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <DetailsSection key={user?.email ?? "anon"} />
      <SecuritySection key={role ?? "anon"} />
      <DataSection />
    </div>
  )
}
