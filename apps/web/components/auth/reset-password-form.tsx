"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { RiLockPasswordLine } from "@remixicon/react"
import { useTranslations } from "next-intl"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import type { z } from "zod"

import { AuthHeading } from "@/components/auth/auth-heading"
import { CodeInput } from "@/components/auth/code-input"
import { FormError } from "@/components/auth/form-error"
import { PasswordInput } from "@/components/auth/password-input"
import { PasswordStrength } from "@/components/auth/password-strength"
import { usePendingAuth } from "@/components/auth/use-pending-auth"
import { useSession } from "@/components/providers/session-provider"
import { startNavigationProgress } from "@/components/shell/route-progress"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { useApiErrorMessage } from "@/hooks/use-api-error-message"
import { useValidationMessage } from "@/hooks/use-validation-message"
import { authApi } from "@/lib/api"
import { clearPendingAuth, maskIdentifier, resetSchema } from "@/lib/auth"

type Values = z.infer<typeof resetSchema>

// FR-AUTH-06: set a new password using the emailed/SMS code.
export function ResetPasswordForm() {
  const router = useRouter()
  const t = useTranslations("Auth")
  const v = useValidationMessage()
  const apiMessage = useApiErrorMessage()
  const { refresh } = useSession()
  const pending = usePendingAuth()
  const [error, setError] = React.useState<string | null>(null)
  const form = useForm<Values>({
    resolver: zodResolver(resetSchema),
    defaultValues: { code: "", password: "", confirm: "" },
  })
  const { control, handleSubmit, formState } = form
  const password = useWatch({ control, name: "password" })

  if (pending === undefined) return <Skeleton className="h-80 w-full" />
  // The API needs the email or phone number with the code; it comes from the forgot-password
  // screen in this tab.
  if (pending === null) {
    return (
      <div className="flex flex-col gap-4">
        <AuthHeading icon={RiLockPasswordLine} title={t("reset.title")} description={t("reset.startFirst")} />
        <Button asChild className="w-fit">
          <Link href="/forgot-password">{t("reset.startFirstAction")}</Link>
        </Button>
      </div>
    )
  }
  const identifier = pending.identifier

  async function onSubmit(values: Values) {
    setError(null)
    try {
      await authApi.resetPassword({ identifier, code: values.code, password: values.password })
    } catch (e) {
      setError(apiMessage(e))
      return
    }
    clearPendingAuth()
    // A reset signs every device out, this one included if it was signed in.
    void refresh()
    toast.success(t("reset.toastTitle"), { description: t("reset.toastBody") })
    startNavigationProgress()
    router.push("/sign-in")
  }

  return (
    <div className="flex flex-col gap-6">
      <AuthHeading
        icon={RiLockPasswordLine}
        title={t("reset.title")}
        description={t.rich("reset.descriptionTo", {
          destination: maskIdentifier(identifier),
          strong: (chunks) => <span className="font-medium text-foreground">{chunks}</span>,
        })}
      />
      <FormError message={error} />

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Controller
          control={control}
          name="code"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="reset-code">{t("reset.codeLabel")}</FieldLabel>
              <CodeInput
                id="reset-code"
                value={field.value}
                onChange={field.onChange}
                invalid={fieldState.invalid}
                disabled={formState.isSubmitting}
              />
              <FieldError>{v(fieldState.error?.message)}</FieldError>
            </Field>
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="reset-password">{t("fields.newPassword")}</FieldLabel>
              <PasswordInput
                {...field}
                id="reset-password"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
                aria-describedby="reset-password-strength"
                className="h-10"
              />
              <PasswordStrength id="reset-password-strength" password={password} />
              <FieldError>{v(fieldState.error?.message)}</FieldError>
            </Field>
          )}
        />
        <Controller
          control={control}
          name="confirm"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="reset-confirm">{t("fields.confirmNewPassword")}</FieldLabel>
              <PasswordInput
                {...field}
                id="reset-confirm"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
                className="h-10"
              />
              <FieldError>{v(fieldState.error?.message)}</FieldError>
            </Field>
          )}
        />
        <Button type="submit" size="lg" className="h-10" disabled={formState.isSubmitting}>
          {formState.isSubmitting && <Spinner />}
          {formState.isSubmitting ? t("reset.submitting") : t("reset.submit")}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        {t("reset.noCode")}{" "}
        <Link href="/forgot-password" className="text-primary underline underline-offset-4">
          {t("reset.requestNew")}
        </Link>
      </p>
    </div>
  )
}
