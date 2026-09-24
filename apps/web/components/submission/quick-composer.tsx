"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiClipboardLine,
  RiImageAddLine,
  RiLink,
  RiSearchEyeLine,
} from "@remixicon/react"
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
// live on /verify, one tap away under "More options".
// On phones it opens in a full-height sheet instead (`sheet`, see mobile-composer.tsx): a
// taller box that takes focus, a Paste button (pasting on a phone is a long-press away
// otherwise), and Verify as a full-width button pinned to the bottom, where the thumb is.
export function QuickComposer({
  className,
  sheet = false,
  initialText,
}: {
  className?: string
  sheet?: boolean
  /** Sheet only: text to start with (the clipboard, when opened from its Paste button). */
  initialText?: string
}) {
  const { form, control, type, text, submitting, uploadProgress, signedIn, onToken, submit, onKeyDown } =
    useSubmissionForm({ detectLinks: true })
  const { setValue, clearErrors, formState } = form
  const media = type === "media"
  const link = !media && isLink(text)
  const length = text.trim().length
  const id = sheet ? "sheet" : "quick"
  const canPaste = sheet && typeof navigator !== "undefined" && !!navigator.clipboard?.readText

  async function pasteClipboard() {
    try {
      const clip = (await navigator.clipboard.readText()).trim()
      if (!clip) return
      if (media) setValue("type", "text")
      setValue("text", clip, { shouldDirty: true })
      clearErrors()
      form.setFocus("text")
    } catch {
      // Permission refused: the box keeps focus, so the system paste menu is still a tap away.
      form.setFocus("text")
    }
  }
  useEffect(() => {
    if (initialText) setValue("text", initialText, { shouldDirty: true })
  }, [initialText, setValue])

  // Switching modes unmounts the button that was pressed, so move focus to the new field
  // rather than letting it fall back to the page (WCAG 2.4.3).
  const focusAfterSwitch = useRef(false)
  function switchTo(next: "text" | "media") {
    focusAfterSwitch.current = true
    setValue("type", next)
    clearErrors()
  }
  useEffect(() => {
    if (!focusAfterSwitch.current) return
    focusAfterSwitch.current = false
    if (media) document.getElementById(`${id}-file`)?.focus()
    else form.setFocus("text")
  }, [media, form, id])

  const verify = (
    <Button
      type="submit"
      size={sheet ? "lg" : "sm"}
      disabled={submitting}
      className={cn(sheet ? "h-12 w-full text-sm" : "ml-auto px-4")}
    >
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
      className={cn("flex flex-col text-left", sheet ? "min-h-0 flex-1" : "border bg-card", className)}
    >
      <div className={cn("p-3 sm:p-4", sheet && "min-h-0 flex-1 overflow-y-auto")}>
        {media ? (
          <Controller
            control={control}
            name="file"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${id}-file`} className="sr-only">
                  Photo, video or voice note
                </FieldLabel>
                <MediaDropzone
                  id={`${id}-file`}
                  value={field.value}
                  onChange={(f) => {
                    field.onChange(f)
                    if (f) void form.trigger("file")
                  }}
                  invalid={fieldState.invalid}
                  describedBy={`${id}-file-error`}
                  progress={uploadProgress}
                  disabled={submitting}
                />
                <FieldError id={`${id}-file-error`} errors={[fieldState.error]} />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={submitting}
                    onClick={() => switchTo("text")}
                    className={cn(sheet && "h-11")}
                  >
                    <RiArrowLeftLine aria-hidden />
                    Paste text or a link instead
                  </Button>
                  {!sheet && verify}
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
                  <FieldLabel htmlFor={`${id}-text`} className="sr-only">
                    Message, claim or link to check
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupTextarea
                      {...field}
                      id={`${id}-text`}
                      rows={sheet ? 7 : 3}
                      autoFocus={sheet}
                      disabled={submitting}
                      aria-invalid={!!error}
                      aria-describedby={`${id}-text-error`}
                      placeholder="Paste a message, claim or link to check…"
                      className={cn("min-h-20 text-base", sheet && "min-h-40")}
                      onChange={(e) => {
                        field.onChange(e)
                        // Editing after a link was detected on submit goes back to plain text.
                        if (type === "url") setValue("type", "text")
                      }}
                    />
                    <InputGroupAddon align="block-end" className="gap-1 border-t pt-2">
                      {canPaste && (
                        <InputGroupButton size="sm" disabled={submitting} onClick={() => void pasteClipboard()} className="h-11">
                          <RiClipboardLine aria-hidden />
                          Paste
                        </InputGroupButton>
                      )}
                      <InputGroupButton
                        size="sm"
                        disabled={submitting}
                        onClick={() => switchTo("media")}
                        className={cn(sheet && "h-11")}
                      >
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
                      {!sheet && verify}
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldError id={`${id}-text-error`} errors={[error]} />
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
          {signedIn ? <span>You&apos;ll be notified when the check is complete.</span> : <CaptchaField onToken={onToken} />}
          <Link href="/verify" className="inline-flex items-center gap-1 font-medium text-primary hover:underline dark:text-foreground">
            More options: language, full articles
            <RiArrowRightLine className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>
      {sheet && (
        <div className="border-t bg-background px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{verify}</div>
      )}
    </form>
  )
}
