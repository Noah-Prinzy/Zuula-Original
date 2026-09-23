"use client"

import * as React from "react"
import Link from "next/link"
import {
  RiArticleLine,
  RiFileTextLine,
  RiImageLine,
  RiLink,
  RiSearchEyeLine,
  RiTranslate2,
} from "@remixicon/react"
import { Controller } from "react-hook-form"

import { CaptchaField } from "@/components/submission/captcha-field"
import { MediaDropzone } from "@/components/submission/media-dropzone"
import { QuickComposer } from "@/components/submission/quick-composer"
import { useSubmissionForm } from "@/components/submission/use-submission-form"
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
import { CONTENT_LANGUAGES, LIMITS, type SubmissionType } from "@/lib/submission"
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

// FR-SUBMIT-01–06: text, link, media or pasted article → tracking ID → Status page.
export function SubmissionComposer({
  variant = "full",
  className,
}: {
  /** "compact" is used on Home: one box for text or a link, plus a media button (QuickComposer). */
  variant?: "full" | "compact"
  className?: string
}) {
  return variant === "compact" ? <QuickComposer className={className} /> : <FullComposer className={className} />
}

// Every input type in tabs, with language and article fields (/verify).
function FullComposer({ className }: { className?: string }) {
  const { form, control, type, text, body, submitting, uploadProgress, signedIn, onToken, submit, onKeyDown } =
    useSubmissionForm()

  return (
    <form
      noValidate
      onSubmit={submit}
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
            <div className={cn("border-b px-3 sm:px-4", "pt-3")}>
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
                        rows={8}
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
                        rows={10}
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

      <div className="flex items-center gap-3 border-t bg-muted/30 p-3 sm:p-4">
        <Controller
          control={control}
          name="language"
          render={({ field }) => (
            // Shares one row with Verify at every width; on phones the label gives way to an icon.
            <Field orientation="horizontal" className="w-auto min-w-0 flex-1 sm:flex-none">
              <FieldLabel htmlFor="submit-language" className="sr-only shrink-0 text-xs text-muted-foreground sm:not-sr-only">
                Language
              </FieldLabel>
              <Select value={field.value} onValueChange={field.onChange} disabled={submitting}>
                <SelectTrigger id="submit-language" size="sm" className="w-full min-w-0 sm:w-48">
                  <RiTranslate2 className="text-muted-foreground sm:hidden" aria-hidden />
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

        <div className="flex shrink-0 flex-col gap-1 sm:flex-1 sm:items-end">
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground lg:inline">
              <Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd>
            </span>
            <Button type="submit" size="lg" disabled={submitting} className="px-5">
              {submitting ? <Spinner /> : <RiSearchEyeLine aria-hidden />}
              {submitting ? (type === "media" ? "Uploading…" : "Submitting…") : "Verify"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1 border-t px-3 py-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-4">
        {signedIn ? (
          <span>You&apos;ll be notified when the check is complete.</span>
        ) : (
          <>
            <span>
              Checking without an account.{" "}
              <Link href="/sign-in" className="text-primary underline underline-offset-4">
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
