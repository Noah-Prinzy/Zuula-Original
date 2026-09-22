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
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { SettingsSection } from "@/components/account/settings-section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { useContentLabels } from "@/hooks/use-content-labels"
import { cn } from "@/lib/utils"

// FR-NOTIFY-01: topic subscriptions.
// Names come from the Categories namespace, hints from Account.alerts.topicHints.<id>.
const TOPICS = [
  { id: "health", category: "Health" },
  { id: "politics", category: "Politics" },
  { id: "elections", category: "Elections" },
  { id: "economy", category: "Economy" },
  { id: "education", category: "Education" },
  { id: "technology", category: "Technology" },
  { id: "weather", category: "Weather" },
  { id: "security", category: "Security" },
] as const

// FR-NOTIFY-02 / 04: delivery channels. Text lives in Account.alerts.channels.<id>.
const CHANNELS = [
  { id: "inapp", icon: RiNotification3Line, fixed: true },
  { id: "email", icon: RiMailLine },
  { id: "push", icon: RiSmartphoneLine },
  { id: "sms", icon: RiMessage2Line },
  { id: "whatsapp", icon: RiWhatsappLine, connect: true },
  { id: "telegram", icon: RiTelegramLine, connect: true },
] as const

const FREQUENCIES = ["instant", "daily", "weekly"] as const
type Frequency = (typeof FREQUENCIES)[number]

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
  const [frequency, setFrequency] = React.useState<Frequency>("instant")
  const [dirty, setDirty] = React.useState(false)
  const t = useTranslations("Account.alerts")
  const ta = useTranslations("Account")
  const labels = useContentLabels()

  const touch = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v)
    setDirty(true)
  }
  const followed = Object.values(topics).filter(Boolean).length

  function save() {
    setDirty(false)
    toast.success(t("saved"), {
      description: t("savedSummary", { count: followed, frequency: t(`frequencies.${frequency}.label`) }),
    })
  }

  const saveBar = (
    <>
      {dirty && <span className="mr-auto text-xs text-muted-foreground">{ta("unsavedChanges")}</span>}
      <Button onClick={save} disabled={!dirty}>
        {t("save")}
      </Button>
    </>
  )

  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <SettingsSection
        id="topics"
        title={t("topicsTitle")}
        description={t("topicsDescription")}
        footer={saveBar}
        className="xl:row-span-2"
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="xs" onClick={() => touch(setTopics)(Object.fromEntries(TOPICS.map((topic) => [topic.id, true])))}>
            {t("followAll")}
          </Button>
          <Button variant="outline" size="xs" onClick={() => touch(setTopics)({})}>
            {t("clear")}
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">{t("followed", { count: followed, total: TOPICS.length })}</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {TOPICS.map((topic) => {
            const on = !!topics[topic.id]
            return (
              <label
                key={topic.id}
                htmlFor={`topic-${topic.id}`}
                className={cn(
                  "flex cursor-pointer items-start gap-3 border p-3 transition-colors hover:bg-muted/40",
                  on && "border-primary/50 bg-primary/5"
                )}
              >
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-medium">{labels.category(topic.category)}</span>
                  <span className="text-xs text-muted-foreground">{t(`topicHints.${topic.id}`)}</span>
                </div>
                <Switch
                  id={`topic-${topic.id}`}
                  checked={on}
                  onCheckedChange={(v) => touch(setTopics)({ ...topics, [topic.id]: v })}
                />
              </label>
            )
          })}
        </div>
      </SettingsSection>

      <SettingsSection id="alert-types" title={t("typesTitle")}>
        <ToggleRow
          id="type-results"
          label={t("types.results.label")}
          description={t("types.results.description")}
          checked={types.results}
          onChange={(v) => touch(setTypes)({ ...types, results: v })}
        />
        <ToggleRow
          id="type-viral"
          label={t("types.viral.label")}
          description={t("types.viral.description")}
          checked={types.viral}
          onChange={(v) => touch(setTypes)({ ...types, viral: v })}
        />
        <ToggleRow
          id="type-reviews"
          label={t("types.reviews.label")}
          description={t("types.reviews.description")}
          checked={types.reviews}
          onChange={(v) => touch(setTypes)({ ...types, reviews: v })}
        />
        <ToggleRow
          id="type-broadcast"
          label={t("types.broadcast.label")}
          description={t("types.broadcast.description")}
          checked
          disabled
          onChange={() => {}}
          extra={<Badge variant="secondary">{t("required")}</Badge>}
        />
      </SettingsSection>

      <SettingsSection id="delivery" title={t("deliveryTitle")} description={t("deliveryDescription")}>
        <div className="flex flex-col gap-4">
          {CHANNELS.map((c) => {
            const needsConnect = "connect" in c && c.connect && !connected[c.id]
            return (
              <ToggleRow
                key={c.id}
                id={`channel-${c.id}`}
                icon={c.icon}
                label={t(`channels.${c.id}.label`)}
                description={t(`channels.${c.id}.description`)}
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
                        toast.info(t("connectSimulated", { channel: t(`channels.${c.id}.label`) }), {
                          description: t("connectSimulatedBody"),
                        })
                      }}
                    >
                      {t("connect")}
                    </Button>
                  ) : null
                }
              />
            )
          })}
        </div>
        <fieldset className="flex flex-col gap-2 border-t pt-4">
          <legend className="mb-2 text-sm font-medium">{t("frequencyLegend")}</legend>
          <RadioGroup value={frequency} onValueChange={(v) => touch(setFrequency)(v as Frequency)} className="gap-2">
            {FREQUENCIES.map((f) => (
              <label
                key={f}
                htmlFor={`freq-${f}`}
                className="flex cursor-pointer items-start gap-3 border p-3 has-[[data-state=checked]]:border-primary/50 has-[[data-state=checked]]:bg-primary/5"
              >
                <RadioGroupItem id={`freq-${f}`} value={f} className="mt-0.5" />
                <span className="flex flex-col">
                  <span className="text-sm font-medium">{t(`frequencies.${f}.label`)}</span>
                  <span className="text-xs text-muted-foreground">{t(`frequencies.${f}.description`)}</span>
                </span>
              </label>
            ))}
          </RadioGroup>
          <p className="text-xs text-muted-foreground">
            {t("frequencyNote")}
          </p>
        </fieldset>
      </SettingsSection>
    </div>
  )
}
