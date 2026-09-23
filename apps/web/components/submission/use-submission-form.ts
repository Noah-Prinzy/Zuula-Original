"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { useSession } from "@/components/providers/session-provider"
import { startNavigationProgress } from "@/components/shell/route-progress"
import { newTrackingId, saveSubmission } from "@/lib/mock/submissions"
import { EMPTY_SUBMISSION, submissionSchema, type SubmissionValues } from "@/lib/submission"

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

// A lone http(s) link, possibly with whitespace around it.
export function isLink(value: string) {
  return /^https?:\/\/\S+$/i.test(value.trim())
}

// Form state and submit flow shared by the full composer (/verify) and the quick one (Home):
// validate → simulated upload → tracking ID → Status page.
export function useSubmissionForm({ detectLinks = false }: { detectLinks?: boolean } = {}) {
  const router = useRouter()
  // FR-AUTH-07: anyone may submit; only a real account skips the CAPTCHA, never a role preview.
  const { source } = useSession()
  const signedIn = source === "account"
  const [uploadProgress, setUploadProgress] = React.useState<number | undefined>()

  const form = useForm<SubmissionValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: EMPTY_SUBMISSION,
    mode: "onSubmit",
    reValidateMode: "onChange",
  })
  const { control, handleSubmit, getValues, setValue, formState } = form
  const type = useWatch({ control, name: "type" })
  const text = useWatch({ control, name: "text" })
  const body = useWatch({ control, name: "body" })
  const submitting = formState.isSubmitting

  const onToken = React.useCallback(
    (token: string | null) => setValue("captchaToken", token),
    [setValue]
  )

  async function onSubmit(values: SubmissionValues) {
    if (!signedIn && !values.captchaToken) {
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
    startNavigationProgress()
    router.push(`/submissions/${trackingId}`)
  }

  // With detectLinks, a text box holding nothing but a link is submitted as a link (the quick
  // composer has one box for both).
  function submit(e?: React.BaseSyntheticEvent) {
    if (detectLinks) {
      const { type: current, text: value } = getValues()
      if (current === "text" && isLink(value)) {
        setValue("type", "url")
        setValue("url", value.trim())
      }
    }
    return handleSubmit(onSubmit)(e)
  }

  // Ctrl/Cmd + Enter submits from any field.
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      void submit()
    }
  }

  return { form, control, type, text, body, submitting, uploadProgress, signedIn, onToken, submit, onKeyDown }
}
