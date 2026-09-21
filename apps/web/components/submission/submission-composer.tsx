"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  RiArticleLine,
  RiFileTextLine,
  RiImageLine,
  RiLink,
  RiSearchEyeLine,
} from "@remixicon/react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { useSession } from "@/components/providers/session-provider"
import { CaptchaField } from "@/components/submission/captcha-field"
import { MediaDropzone } from "@/components/submission/media-dropzone"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { newTrackingId, saveSubmission } from "@/lib/mock/submissions"
import {
  CONTENT_LANGUAGES,
  EMPTY_SUBMISSION,
  LIMITS,
  submissionSchema,
  type SubmissionType,
  type SubmissionValues,
} from "@/lib/submission"
import { cn } from "@/lib/utils"

const TABS: { value: SubmissionType; label: string; icon: typeof RiFileTextLine }[] = [
  { value: "text", label: "Text", icon: RiFileTextLine },
  { value: "url", label: "Link", icon: RiLink },
  { value: "media", label: "Media", icon: RiImageLine },
  { value: "article", label: "Article", icon: RiArticleLine },
]

function Counter({ value, max }: { value: number; max: number }) {
  return (
    <span className={cn("tabular-nums", value > max && "text-destructive")}>
      {value.toLocaleString()}/{max.toLocaleString()}
    </span>
  )
}

function previewOf(v: SubmissionValues) {
  switch (v.type) {
    case "text":
      return v.text.trim().slice(0, 200)
    case "url":
      return v.url.trim()
    case "media":
      return v.file?.name ?? ""
    case "article":
      return (v.headline.trim() || v.body.trim()).slice(0, 200)
  }
}

// FR-SUBMIT-01–06: text, link, media or pasted article → tracking ID → Status page.
export function SubmissionComposer({
  variant = "full",
  className,
}: {
  /** "compact" is used on Home: same form, lighter chrome. */
  variant?: "full" | "compact"
  className?: string
}) {
  const router = useRouter()
  const { user } = useSession()
  const [uploadProgress, setUploadProgress] = React.useState<number | undefined>()

  const form = useForm<SubmissionValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: EMPTY_SUBMISSION,
    mode: "onSubmit",
    reValidateMode: "onChange",
  })
  const { control, handleSubmit, setValue, formState } = form
  const type = useWatch({ control, name: "type" })
  const text = useWatch({ control, name: "text" })
  const body = useWatch({ control, name: "body" })
  const submitting = formState.isSubmitting

  const onToken = React.useCallback(
    (token: string | null) => setValue("captchaToken", token),
    [setValue]
  )

  async function onSubmit(values: SubmissionValues) {
    if (!user && !values.captchaToken) {
      toast.error("Please complete the human check first.")
      return
    }

    // Simulated upload until the API exists; real uploads stream progress from the server.
    if (values.type === "media") {
      for (let p = 0; p <= 100; p += 10) {
        setUploadProgress(p)
        await new Promise((r) => setTimeout(r, 120))
      }
    } else {
      await new Promise((r) => setTimeout(r, 400))
    }

    const trackingId = newTrackingId()
    saveSubmission({
      trackingId,
      type: values.type,
      language: values.language,
      preview: previewOf(values),
      fileName: values.file?.name,
      submittedAt: new Date().toISOString(),
    })
    toast.success("Submitted for checking", { description: `Tracking ID ${trackingId}` })
    router.push(`/submissions/${trackingId}`)
  }

  // Ctrl/Cmd + Enter submits from any field.
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      void handleSubmit(onSubmit)()
    }
  }

  const compact = variant === "compact"

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={onKeyDown}
      aria-label="Submit content to verify"
      className={cn("flex flex-col border bg-card text-left", className)}
    >
      <Controller
        control={control}
        name="type"
        render={({ field }) => (
          <Tabs
            value={field.value}
            onValueChange={(v) => {
              field.onChange(v as SubmissionType)
              form.clearErrors()
            }}
            className="gap-0"
          >
            <div className="border-b px-3 pt-3 sm:px-4">
              <TabsList variant="line" className="w-full justify-start">
                {TABS.map((t) => (
                  <TabsTrigger key={t.value} value={t.value} disabled={submitting} className="flex-none">
                    <t.icon aria-hidden />
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="p-3 sm:p-4">
              <TabsContent value="text">
                <Controller
                  control={control}
                  name="text"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="submit-text" className="sr-only">
                        Text to check
                      </FieldLabel>
                      <Textarea
                        {...field}
                        id="submit-text"
                        rows={compact ? 5 : 8}
                        disabled={submitting}
                        aria-invalid={fieldState.invalid}
                        placeholder="Paste a message, post or claim you want to check…"
                        className="min-h-32 resize-y text-base"
                      />
                      <div className="flex justify-between gap-2 text-xs text-muted-foreground">
                        <FieldError errors={[fieldState.error]} />
                        <span className="ml-auto">
                          <Counter value={text.trim().length} max={LIMITS.text.max} />
                        </span>
                      </div>
                    </Field>
                  )}
                />
              </TabsContent>

              <TabsContent value="url">
                <Controller
                  control={control}
                  name="url"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="submit-url">Article or post link</FieldLabel>
                      <Input
                        {...field}
                        id="submit-url"
                        type="url"
                        inputMode="url"
                        autoComplete="off"
                        disabled={submitting}
                        aria-invalid={fieldState.invalid}
                        placeholder="https://"
                        className="h-11 text-base"
                      />
                      <FieldDescription>
                        We&apos;ll fetch the article text and check its claims.
                      </FieldDescription>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </TabsContent>

              <TabsContent value="media">
                <Controller
                  control={control}
                  name="file"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="submit-file" className="sr-only">
                        Media file
                      </FieldLabel>
                      <MediaDropzone
                        id="submit-file"
                        value={field.value}
                        onChange={(f) => {
                          field.onChange(f)
                          if (f) void form.trigger("file")
                        }}
                        invalid={fieldState.invalid}
                        describedBy="submit-file-error"
                        progress={uploadProgress}
                        disabled={submitting}
                      />
                      <FieldError id="submit-file-error" errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </TabsContent>

              <TabsContent value="article" className="flex flex-col gap-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <Controller
                    control={control}
                    name="headline"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="submit-headline">Headline (optional)</FieldLabel>
                        <Input {...field} id="submit-headline" disabled={submitting} aria-invalid={fieldState.invalid} />
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />
                  <Controller
                    control={control}
                    name="articleUrl"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="submit-article-url">Where it was published (optional)</FieldLabel>
                        <Input
                          {...field}
                          id="submit-article-url"
                          type="url"
                          inputMode="url"
                          disabled={submitting}
                          aria-invalid={fieldState.invalid}
                          placeholder="https://"
                        />
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />
                </div>
                <Controller
                  control={control}
                  name="body"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="submit-body">Article text</FieldLabel>
                      <Textarea
                        {...field}
                        id="submit-body"
                        rows={compact ? 6 : 10}
                        disabled={submitting}
                        aria-invalid={fieldState.invalid}
                        placeholder="Paste the full article…"
                        className="min-h-40 resize-y"
                      />
                      <div className="flex justify-between gap-2 text-xs text-muted-foreground">
                        <FieldError errors={[fieldState.error]} />
                        <span className="ml-auto">
                          <Counter value={body.trim().length} max={LIMITS.article.max} />
                        </span>
                      </div>
                    </Field>
                  )}
                />
              </TabsContent>
            </div>
          </Tabs>
        )}
      />

      <div className="flex flex-col gap-3 border-t bg-muted/30 p-3 sm:flex-row sm:items-center sm:p-4">
        <Controller
          control={control}
          name="language"
          render={({ field }) => (
            <Field orientation="horizontal" className="w-auto">
              <FieldLabel htmlFor="submit-language" className="shrink-0 text-xs text-muted-foreground">
                Language
              </FieldLabel>
              <Select value={field.value} onValueChange={field.onChange} disabled={submitting}>
                <SelectTrigger id="submit-language" size="sm" className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_LANGUAGES.map((l) => (
                    <SelectItem key={l.code} value={l.code}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />

        <div className="flex flex-1 flex-col gap-1 sm:items-end">
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground lg:inline">
              <Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd>
            </span>
            <Button type="submit" size="lg" disabled={submitting} className="w-full px-5 sm:w-auto">
              {submitting ? <Spinner /> : <RiSearchEyeLine aria-hidden />}
              {submitting ? (type === "media" ? "Uploading…" : "Submitting…") : "Verify"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1 border-t px-3 py-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-4">
        {user ? (
          <span>You&apos;ll be notified when the check is complete.</span>
        ) : (
          <>
            <span>
              Checking without an account.{" "}
              <Link href="/sign-in" className="text-primary underline-offset-4 hover:underline">
                Sign in
              </Link>{" "}
              to be notified when it&apos;s done.
            </span>
            <CaptchaField onToken={onToken} />
          </>
        )}
      </div>
      <p className="border-t px-3 py-2 text-[11px] text-muted-foreground sm:px-4">
        By submitting you agree to our{" "}
        <Link href="/legal/terms" className="underline underline-offset-2">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/legal/privacy" className="underline underline-offset-2">
          Privacy Policy
        </Link>
        . Don&apos;t include personal information you don&apos;t want stored.
      </p>
    </form>
  )
}
