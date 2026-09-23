"use client"

import Link from "next/link"
import { RiArrowLeftLine, RiArrowRightLine, RiImageAddLine, RiLink, RiSearchEyeLine } from "@remixicon/react"
import { Controller } from "react-hook-form"

import { CaptchaField } from "@/components/submission/captcha-field"
import { MediaDropzone } from "@/components/submission/media-dropzone"
import { isLink, useSubmissionForm } from "@/components/submission/use-submission-form"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { LIMITS } from "@/lib/submission"
import { cn } from "@/lib/utils"

// Home's composer: a single box, like a search or chat field. Paste a message or a link (a
// lone link is detected and checked as one), or switch the box to a photo, video or voice
// note. Language is detected automatically; the language picker and the long-article form
// live on /verify, one tap away under "More options". Same layout at every width.
export function QuickComposer({ className }: { className?: string }) {
  const { form, control, type, text, submitting, uploadProgress, user, onToken, submit, onKeyDown } =
    useSubmissionForm({ detectLinks: true })
  const { setValue, clearErrors, formState } = form
  const media = type === "media"
  const link = !media && isLink(text)
  const length = text.trim().length

  function switchTo(next: "text" | "media") {
    setValue("type", next)
    clearErrors()
  }

  const verify = (
    <Button type="submit" size="sm" disabled={submitting} className="ml-auto px-4">
      {submitting ? <Spinner /> : <RiSearchEyeLine aria-hidden />}
      {submitting ? (media ? "Uploading…" : "Submitting…") : "Verify"}
    </Button>
  )

  return (
    <form
      noValidate
      onSubmit={submit}
      onKeyDown={onKeyDown}
      aria-label="Submit content to verify"
      className={cn("flex flex-col border bg-card text-left", className)}
    >
      <div className="p-3 sm:p-4">
        {media ? (
          <Controller
            control={control}
            name="file"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="quick-file" className="sr-only">
                  Photo, video or voice note
                </FieldLabel>
                <MediaDropzone
                  id="quick-file"
                  value={field.value}
                  onChange={(f) => {
                    field.onChange(f)
                    if (f) void form.trigger("file")
                  }}
                  invalid={fieldState.invalid}
                  describedBy="quick-file-error"
                  progress={uploadProgress}
                  disabled={submitting}
                />
                <FieldError id="quick-file-error" errors={[fieldState.error]} />
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" size="sm" disabled={submitting} onClick={() => switchTo("text")}>
                    <RiArrowLeftLine aria-hidden />
                    Paste text or a link instead
                  </Button>
                  {verify}
                </div>
              </Field>
            )}
          />
        ) : (
          <Controller
            control={control}
            name="text"
            render={({ field, fieldState }) => {
              // A link that fails validation reports on "url"; show it under the same box.
              const error = fieldState.error ?? formState.errors.url
              return (
                <Field data-invalid={!!error}>
                  <FieldLabel htmlFor="quick-text" className="sr-only">
                    Message, claim or link to check
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupTextarea
                      {...field}
                      id="quick-text"
                      rows={3}
                      disabled={submitting}
                      aria-invalid={!!error}
                      aria-describedby="quick-text-error"
                      placeholder="Paste a message, claim or link to check…"
                      className="min-h-20 text-base"
                      onChange={(e) => {
                        field.onChange(e)
                        // Editing after a link was detected on submit goes back to plain text.
                        if (type === "url") setValue("type", "text")
                      }}
                    />
                    <InputGroupAddon align="block-end" className="gap-1 border-t pt-2">
                      <InputGroupButton size="sm" disabled={submitting} onClick={() => switchTo("media")}>
                        <RiImageAddLine aria-hidden />
                        <span className="sm:hidden">Media</span>
                        <span className="max-sm:hidden">Photo, video or voice note</span>
                      </InputGroupButton>
                      {link ? (
                        <InputGroupText className="text-primary dark:text-foreground">
                          <RiLink aria-hidden />
                          Link
                        </InputGroupText>
                      ) : (
                        length > 0 && (
                          <InputGroupText className={cn("tabular-nums", length > LIMITS.text.max && "text-destructive")}>
                            {length.toLocaleString()}/{LIMITS.text.max.toLocaleString()}
                          </InputGroupText>
                        )
                      )}
                      {verify}
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldError id="quick-text-error" errors={[error]} />
                </Field>
              )
            }}
          />
        )}
      </div>

      <div className="flex flex-col gap-1.5 border-t px-3 py-2 text-[11px] text-muted-foreground sm:px-4">
        <p>
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
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          {user ? <span>You&apos;ll be notified when the check is complete.</span> : <CaptchaField onToken={onToken} />}
          <Link href="/verify" className="inline-flex items-center gap-1 font-medium text-primary hover:underline dark:text-foreground">
            More options: language, full articles
            <RiArrowRightLine className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </form>
  )
}
