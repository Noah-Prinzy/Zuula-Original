"use client"

import * as React from "react"
import Link from "next/link"
import { RiAddLine, RiAlertLine, RiFileCopyLine, RiKey2Line } from "@remixicon/react"
import { toast } from "sonner"

import { SettingsSection } from "@/components/account/settings-section"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  API_RATE_LIMIT,
  relativeTime,
  SAMPLE_API_KEYS,
  SAMPLE_API_USAGE,
  type ApiKey,
  type ApiScope,
} from "@/lib/mock/account"

const SCOPES: { value: ApiScope; label: string; description: string }[] = [
  { value: "submit", label: "Submit content", description: "POST /v1/checks: send text, links or media for verification" },
  { value: "read", label: "Read results", description: "GET /v1/checks and /v1/fact-checks: verdicts, explanations, citations" },
]

const MAX_KEYS = 5

// Demo secret; real keys are generated and hashed by the server, shown once.
function demoSecret() {
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, "0")).join("")
  return `zl_live_${hex}`
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  } catch {
    toast.error("Couldn't copy. Select the key and copy it manually.")
  }
}

function CreateKeyDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onCreate: (k: ApiKey) => void
}) {
  const [name, setName] = React.useState("")
  const [scopes, setScopes] = React.useState<ApiScope[]>(["submit", "read"])
  const [error, setError] = React.useState<string | null>(null)
  const [secret, setSecret] = React.useState<string | null>(null)

  function close(o: boolean) {
    onOpenChange(o)
    if (!o) {
      setName("")
      setScopes(["submit", "read"])
      setError(null)
      setSecret(null)
    }
  }

  function create(e: React.FormEvent) {
    e.preventDefault()
    if (name.trim().length < 2) return setError("Give the key a name so you recognise it later.")
    if (scopes.length === 0) return setError("Choose at least one permission.")
    const s = demoSecret()
    setSecret(s)
    onCreate({
      id: crypto.randomUUID(),
      name: name.trim(),
      prefix: s.slice(0, 12),
      scopes,
      createdAt: new Date().toISOString().slice(0, 10),
      lastUsedAt: null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        {secret ? (
          <>
            <DialogHeader>
              <DialogTitle>Copy your new key</DialogTitle>
              <DialogDescription>
                This is the only time we show the full key. Store it in a password manager or your server&apos;s secret
                store, never in front-end code.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2 border bg-muted/40 p-3">
              <code className="min-w-0 flex-1 font-mono text-sm break-all">{secret}</code>
              <Button variant="outline" size="icon-sm" onClick={() => copy(secret)} aria-label="Copy key">
                <RiFileCopyLine aria-hidden />
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => close(false)}>I&apos;ve saved it</Button>
            </DialogFooter>
          </>
        ) : (
          <form noValidate onSubmit={create} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Create an API key</DialogTitle>
              <DialogDescription>Each key is limited to {API_RATE_LIMIT} requests per hour.</DialogDescription>
            </DialogHeader>
            <Field>
              <FieldLabel htmlFor="key-name">Name</FieldLabel>
              <Input id="key-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Newsroom CMS" autoComplete="off" />
            </Field>
            <FieldSet>
              <FieldLegend variant="label">Permissions</FieldLegend>
              <div className="flex flex-col gap-3">
                {SCOPES.map((s) => (
                  <div key={s.value} className="flex items-start gap-2">
                    <Checkbox
                      id={`scope-${s.value}`}
                      checked={scopes.includes(s.value)}
                      onCheckedChange={(c) =>
                        setScopes((cur) => (c === true ? [...cur, s.value] : cur.filter((x) => x !== s.value)))
                      }
                      className="mt-0.5"
                    />
                    <label htmlFor={`scope-${s.value}`} className="flex flex-col">
                      <span className="text-sm font-medium">{s.label}</span>
                      <span className="font-mono text-xs text-muted-foreground">{s.description}</span>
                    </label>
                  </div>
                ))}
              </div>
            </FieldSet>
            {error && <FieldError>{error}</FieldError>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => close(false)}>
                Cancel
              </Button>
              <Button type="submit">Create key</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

// FR-API-01 / 02: API keys for partners and journalists.
export function ApiKeys() {
  const [keys, setKeys] = React.useState(SAMPLE_API_KEYS)
  const [open, setOpen] = React.useState(false)
  const pct = Math.round((SAMPLE_API_USAGE.usedThisHour / API_RATE_LIMIT) * 100)

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <SettingsSection
        id="keys"
        title="Your keys"
        description="Use keys to submit content and read results from your own tools."
        footer={
          <Button onClick={() => setOpen(true)} disabled={keys.length >= MAX_KEYS}>
            <RiAddLine aria-hidden /> Create key
          </Button>
        }
      >
        {keys.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyTitle>No API keys</EmptyTitle>
              <EmptyDescription>Create a key to start using the Zuula API.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="flex flex-col divide-y border">
            {keys.map((k) => (
              <li key={k.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
                <RiKey2Line className="hidden size-5 shrink-0 text-muted-foreground sm:block" aria-hidden />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-sm font-medium">{k.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{k.prefix}••••••••</span>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    {k.scopes.map((s) => (
                      <Badge key={s} variant="outline">
                        {s}
                      </Badge>
                    ))}
                    <span>Created {k.createdAt}</span>
                    <span>· {k.lastUsedAt ? `Last used ${relativeTime(k.lastUsedAt)}` : "Never used"}</span>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                      Revoke
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Revoke “{k.name}”?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Anything using this key stops working immediately. This can&apos;t be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-white hover:bg-destructive/90"
                        onClick={() => {
                          setKeys((ks) => ks.filter((x) => x.id !== k.id))
                          toast.success(`Revoked “${k.name}”`)
                        }}
                      >
                        Revoke key
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </li>
            ))}
          </ul>
        )}
        {keys.length >= MAX_KEYS && (
          <p className="text-xs text-muted-foreground">You can have up to {MAX_KEYS} keys. Revoke one to create another.</p>
        )}
      </SettingsSection>

      <div className="flex flex-col gap-6">
        <SettingsSection id="usage" title="Usage">
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between text-sm">
              <span>This hour</span>
              <span className="font-mono tabular-nums">
                {SAMPLE_API_USAGE.usedThisHour} / {API_RATE_LIMIT}
              </span>
            </div>
            <Progress value={pct} aria-label={`${pct}% of hourly limit used`} />
            <p className="text-xs text-muted-foreground">
              {SAMPLE_API_USAGE.last24h.toLocaleString()} requests in the last 24 hours. Limits reset every hour. Need
              more? Contact us about a partner plan.
            </p>
          </div>
        </SettingsSection>
        <div className="flex gap-3 border border-verdict-likely-false/40 bg-verdict-likely-false/5 p-4 text-sm">
          <RiAlertLine className="mt-0.5 size-4 shrink-0 text-verdict-likely-false" aria-hidden />
          <p>
            Keep keys secret. Send them in the <code className="font-mono text-xs">Authorization</code> header from your
            server only. Read the{" "}
            <Link href="/developers" className="text-primary underline underline-offset-2">
              API documentation
            </Link>
            .
          </p>
        </div>
      </div>

      <CreateKeyDialog open={open} onOpenChange={setOpen} onCreate={(k) => setKeys((ks) => [k, ...ks])} />
    </div>
  )
}
