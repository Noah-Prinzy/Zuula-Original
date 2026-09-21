"use client"

import * as React from "react"
import {
  RiMailLine,
  RiMessage2Line,
  RiNotification3Line,
  RiSmartphoneLine,
  RiTelegramLine,
  RiWhatsappLine,
} from "@remixicon/react"
import { toast } from "sonner"

import { SettingsSection } from "@/components/account/settings-section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

// FR-NOTIFY-01: topic subscriptions.
const TOPICS = [
  { id: "health", label: "Health", description: "Disease outbreaks, cures, vaccines" },
  { id: "politics", label: "Politics", description: "Government, parliament, public figures" },
  { id: "elections", label: "Elections", description: "Voting, results, campaigns" },
  { id: "economy", label: "Economy", description: "Prices, currency, taxes, jobs" },
  { id: "education", label: "Education", description: "Schools, exams, universities" },
  { id: "technology", label: "Technology", description: "Scams, phishing, mobile money" },
  { id: "weather", label: "Weather", description: "Floods, droughts, disasters" },
  { id: "security", label: "Security", description: "Crime, conflict, public safety" },
]

// FR-NOTIFY-02 / 04: delivery channels.
const CHANNELS = [
  { id: "inapp", label: "In-app", description: "The bell in Zuula", icon: RiNotification3Line, fixed: true },
  { id: "email", label: "Email", description: "To your account email", icon: RiMailLine },
  { id: "push", label: "Push notifications", description: "On phones where Zuula is installed", icon: RiSmartphoneLine },
  { id: "sms", label: "SMS", description: "Needs a phone number on your profile", icon: RiMessage2Line },
  { id: "whatsapp", label: "WhatsApp", description: "Connect your WhatsApp number", icon: RiWhatsappLine, connect: true },
  { id: "telegram", label: "Telegram", description: "Connect the Zuula Telegram bot", icon: RiTelegramLine, connect: true },
] as const

const FREQUENCIES = [
  { value: "instant", label: "As it happens", description: "Best for journalists and reviewers" },
  { value: "daily", label: "Daily digest", description: "One summary every evening" },
  { value: "weekly", label: "Weekly digest", description: "One summary every Monday" },
]

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
  disabled,
  extra,
  icon: Icon,
}: {
  id: string
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  extra?: React.ReactNode
  icon?: typeof RiMailLine
}) {
  return (
    <div className="flex items-center gap-3">
      {Icon && <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />}
      <div className="flex min-w-0 flex-1 flex-col">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      {extra}
      <Switch id={id} checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  )
}

export function AlertSettings() {
  const [topics, setTopics] = React.useState<Record<string, boolean>>({ health: true, elections: true, technology: true })
  const [channels, setChannels] = React.useState<Record<string, boolean>>({ inapp: true, email: true, push: false, sms: false })
  const [connected, setConnected] = React.useState<Record<string, boolean>>({})
  const [types, setTypes] = React.useState({ results: true, viral: true, reviews: true })
  const [frequency, setFrequency] = React.useState("instant")
  const [dirty, setDirty] = React.useState(false)

  const touch = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v)
    setDirty(true)
  }
  const followed = Object.values(topics).filter(Boolean).length

  function save() {
    setDirty(false)
    toast.success("Alert preferences saved", {
      description: `${followed} topic${followed === 1 ? "" : "s"} · ${FREQUENCIES.find((f) => f.value === frequency)?.label}`,
    })
  }

  const saveBar = (
    <>
      {dirty && <span className="mr-auto text-xs text-muted-foreground">You have unsaved changes</span>}
      <Button onClick={save} disabled={!dirty}>
        Save preferences
      </Button>
    </>
  )

  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <SettingsSection
        id="topics"
        title="Topics you follow"
        description="Get alerted when new fact-checks are published in these topics."
        footer={saveBar}
        className="xl:row-span-2"
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="xs" onClick={() => touch(setTopics)(Object.fromEntries(TOPICS.map((t) => [t.id, true])))}>
            Follow all
          </Button>
          <Button variant="outline" size="xs" onClick={() => touch(setTopics)({})}>
            Clear
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">{followed} of {TOPICS.length} followed</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {TOPICS.map((t) => {
            const on = !!topics[t.id]
            return (
              <label
                key={t.id}
                htmlFor={`topic-${t.id}`}
                className={cn(
                  "flex cursor-pointer items-start gap-3 border p-3 transition-colors hover:bg-muted/40",
                  on && "border-primary/50 bg-primary/5"
                )}
              >
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-medium">{t.label}</span>
                  <span className="text-xs text-muted-foreground">{t.description}</span>
                </div>
                <Switch
                  id={`topic-${t.id}`}
                  checked={on}
                  onCheckedChange={(v) => touch(setTopics)({ ...topics, [t.id]: v })}
                />
              </label>
            )
          })}
        </div>
      </SettingsSection>

      <SettingsSection id="alert-types" title="What to alert me about">
        <ToggleRow
          id="type-results"
          label="My submission results"
          description="When a check you submitted is finished."
          checked={types.results}
          onChange={(v) => touch(setTypes)({ ...types, results: v })}
        />
        <ToggleRow
          id="type-viral"
          label="Viral misinformation"
          description="When a false claim is spreading fast, even outside your topics."
          checked={types.viral}
          onChange={(v) => touch(setTypes)({ ...types, viral: v })}
        />
        <ToggleRow
          id="type-reviews"
          label="Expert reviews"
          description="When a verdict you rated is confirmed or changed by an expert."
          checked={types.reviews}
          onChange={(v) => touch(setTypes)({ ...types, reviews: v })}
        />
        <ToggleRow
          id="type-broadcast"
          label="Emergency broadcasts"
          description="High-priority alerts from Zuula administrators. Always on."
          checked
          disabled
          onChange={() => {}}
          extra={<Badge variant="secondary">Required</Badge>}
        />
      </SettingsSection>

      <SettingsSection id="delivery" title="How and when" description="Choose where alerts reach you and how often.">
        <div className="flex flex-col gap-4">
          {CHANNELS.map((c) => {
            const needsConnect = "connect" in c && c.connect && !connected[c.id]
            return (
              <ToggleRow
                key={c.id}
                id={`channel-${c.id}`}
                icon={c.icon}
                label={c.label}
                description={c.description}
                checked={"fixed" in c && c.fixed ? true : !!channels[c.id]}
                disabled={("fixed" in c && c.fixed) || needsConnect}
                onChange={(v) => touch(setChannels)({ ...channels, [c.id]: v })}
                extra={
                  needsConnect ? (
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => {
                        setConnected({ ...connected, [c.id]: true })
                        toast.info(`${c.label} connection is simulated`, {
                          description: "The real connection flow arrives with the messaging integrations.",
                        })
                      }}
                    >
                      Connect
                    </Button>
                  ) : null
                }
              />
            )
          })}
        </div>
        <fieldset className="flex flex-col gap-2 border-t pt-4">
          <legend className="mb-2 text-sm font-medium">Frequency for topic alerts</legend>
          <RadioGroup value={frequency} onValueChange={touch(setFrequency)} className="gap-2">
            {FREQUENCIES.map((f) => (
              <label
                key={f.value}
                htmlFor={`freq-${f.value}`}
                className="flex cursor-pointer items-start gap-3 border p-3 has-[[data-state=checked]]:border-primary/50 has-[[data-state=checked]]:bg-primary/5"
              >
                <RadioGroupItem id={`freq-${f.value}`} value={f.value} className="mt-0.5" />
                <span className="flex flex-col">
                  <span className="text-sm font-medium">{f.label}</span>
                  <span className="text-xs text-muted-foreground">{f.description}</span>
                </span>
              </label>
            ))}
          </RadioGroup>
          <p className="text-xs text-muted-foreground">
            Results of your own checks and emergency broadcasts are always sent straight away.
          </p>
        </fieldset>
      </SettingsSection>
    </div>
  )
}
