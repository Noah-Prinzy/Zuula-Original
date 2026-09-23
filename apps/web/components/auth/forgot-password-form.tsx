"use client"

import * as React from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { RiArrowLeftLine, RiLockPasswordLine, RiMailSendLine } from "@remixicon/react"
import { useTranslations } from "next-intl"
import { Controller, useForm } from "react-hook-form"
import type { z } from "zod"

import { AuthHeading } from "@/components/auth/auth-heading"
import { FormError } from "@/components/auth/form-error"
import { ResendCode } from "@/components/auth/resend-code"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useApiErrorMessage } from "@/hooks/use-api-error-message"
import { useValidationMessage } from "@/hooks/use-validation-message"
import { authApi } from "@/lib/api"
import { forgotSchema, identifierKind, maskIdentifier, setPendingAuth } from "@/lib/auth"

type Values = z.infer<typeof forgotSchema>

// FR-AUTH-06: request a reset code by email or SMS.
export function ForgotPasswordForm() {
  const t = useTranslations("Auth")
  const v = useValidationMessage()
  const apiMessage = useApiErrorMessage()
  const [sentTo, setSentTo] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const form = useForm<Values>({ resolver: zodResolver(forgotSchema), defaultValues: { identifier: "" } })
  const { control, handleSubmit, formState } = form

  async function onSubmit(values: Values) {
    setError(null)
    const identifier = values.identifier.trim()
    try {
      // Always 202, account or not: the API never reveals who has one.
      await authApi.forgotPassword({ identifier })
    } catch (e) {
      setError(apiMessage(e))
      return
    }
    // The reset call needs the identifier again along with the code.
    setPendingAuth({ identifier })
    setSentTo(identifier)
  }

  const back = (
    <Link href="/sign-in" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <RiArrowLeftLine className="size-4" aria-hidden /> {t("forgot.backToSignIn")}
    </Link>
  )

  if (sentTo) {
    const masked = maskIdentifier(sentTo)
    return (
      <div className="flex flex-col gap-6">
        <AuthHeading
          icon={RiMailSendLine}
          title={t("forgot.sentTitle")}
          description={t.rich("forgot.sentBody", {
            destination: masked,
            channel: identifierKind(sentTo) === "phone" ? "sms" : "email",
            strong: (chunks) => <span className="font-medium text-foreground">{chunks}</span>,
          })}
        />
        <Button asChild size="lg" className="h-10">
          <Link href="/reset-password">{t("forgot.enterCode")}</Link>
        </Button>
        <ResendCode destination={masked} onResend={() => authApi.forgotPassword({ identifier: sentTo })} />
        {back}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <AuthHeading icon={RiLockPasswordLine} title={t("forgot.title")} description={t("forgot.description")} />
      <FormError message={error} />
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Controller
          control={control}
          name="identifier"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="forgot-identifier">{t("fields.identifier")}</FieldLabel>
              <Input
                {...field}
                id="forgot-identifier"
                autoComplete="username"
                aria-invalid={fieldState.invalid}
                placeholder={t("fields.identifierPlaceholder")}
                className="h-10"
              />
              <FieldError>{v(fieldState.error?.message)}</FieldError>
            </Field>
          )}
        />
        <Button type="submit" size="lg" className="h-10" disabled={formState.isSubmitting}>
          {formState.isSubmitting && <Spinner />}
          {formState.isSubmitting ? t("forgot.submitting") : t("forgot.submit")}
        </Button>
      </form>
      {back}
    </div>
  )
}
