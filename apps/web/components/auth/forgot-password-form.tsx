"use client"

import * as React from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { RiArrowLeftLine, RiLockPasswordLine, RiMailSendLine } from "@remixicon/react"
import { Controller, useForm } from "react-hook-form"
import type { z } from "zod"

import { AuthHeading } from "@/components/auth/auth-heading"
import { ResendCode } from "@/components/auth/resend-code"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { forgotSchema, identifierKind, maskIdentifier, setPendingAuth } from "@/lib/auth"

type Values = z.infer<typeof forgotSchema>

// FR-AUTH-06: request a reset code by email or SMS.
export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = React.useState<string | null>(null)
  const form = useForm<Values>({ resolver: zodResolver(forgotSchema), defaultValues: { identifier: "" } })
  const { control, handleSubmit, formState } = form

  async function onSubmit(v: Values) {
    await new Promise((r) => setTimeout(r, 600))
    setPendingAuth({ role: "public", identifier: v.identifier, next: "/sign-in" })
    setSentTo(v.identifier)
  }

  const back = (
    <Link href="/sign-in" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <RiArrowLeftLine className="size-4" aria-hidden /> Back to sign in
    </Link>
  )

  if (sentTo) {
    const masked = maskIdentifier(sentTo)
    return (
      <div className="flex flex-col gap-6">
        <AuthHeading
          icon={RiMailSendLine}
          title="Check your messages"
          description={
            <>
              If an account exists for <span className="font-medium text-foreground">{masked}</span>, we&apos;ve sent a
              6-digit reset code by {identifierKind(sentTo) === "phone" ? "SMS" : "email"}. It expires in 15 minutes.
            </>
          }
        />
        <Button asChild size="lg" className="h-10">
          <Link href="/reset-password">Enter reset code</Link>
        </Button>
        <ResendCode destination={masked} />
        {back}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <AuthHeading
        icon={RiLockPasswordLine}
        title="Forgot your password?"
        description="Enter the email or phone number on your account and we'll send you a reset code."
      />
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Controller
          control={control}
          name="identifier"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="forgot-identifier">Email or phone</FieldLabel>
              <Input
                {...field}
                id="forgot-identifier"
                autoComplete="username"
                aria-invalid={fieldState.invalid}
                placeholder="you@example.com or 07XX XXX XXX"
                className="h-10"
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Button type="submit" size="lg" className="h-10" disabled={formState.isSubmitting}>
          {formState.isSubmitting && <Spinner />}
          {formState.isSubmitting ? "Sending…" : "Send reset code"}
        </Button>
      </form>
      {back}
    </div>
  )
}
