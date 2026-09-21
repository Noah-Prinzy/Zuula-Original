"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { RiFlaskLine, RiLockPasswordLine } from "@remixicon/react"
import { useTranslations } from "next-intl"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import type { z } from "zod"

import { AuthHeading } from "@/components/auth/auth-heading"
import { CodeInput } from "@/components/auth/code-input"
import { PasswordInput } from "@/components/auth/password-input"
import { PasswordStrength } from "@/components/auth/password-strength"
import { usePendingAuth } from "@/components/auth/use-pending-auth"
import { startNavigationProgress } from "@/components/shell/route-progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { useValidationMessage } from "@/hooks/use-validation-message"
import { clearPendingAuth, isDemoCodeValid, maskIdentifier, resetSchema } from "@/lib/auth"

type Values = z.infer<typeof resetSchema>

// FR-AUTH-06: set a new password using the emailed/SMS code.
export function ResetPasswordForm() {
  const router = useRouter()
  const t = useTranslations("Auth")
  const v = useValidationMessage()
  const pending = usePendingAuth()
  const form = useForm<Values>({
    resolver: zodResolver(resetSchema),
    defaultValues: { code: "", password: "", confirm: "" },
  })
  const { control, handleSubmit, formState, setError } = form
  const password = useWatch({ control, name: "password" })

  async function onSubmit(values: Values) {
    await new Promise((r) => setTimeout(r, 600))
    if (!isDemoCodeValid(values.code)) {
      setError("code", { message: "codeInvalid" })
      return
    }
    clearPendingAuth()
    toast.success(t("reset.toastTitle"), { description: t("reset.toastBody") })
    startNavigationProgress()
    router.push("/sign-in")
  }

  return (
    <div className="flex flex-col gap-6">
      <AuthHeading
        icon={RiLockPasswordLine}
        title={t("reset.title")}
        description={
          pending
            ? t.rich("reset.descriptionTo", {
                destination: maskIdentifier(pending.identifier),
                strong: (chunks) => <span className="font-medium text-foreground">{chunks}</span>,
              })
            : t("reset.description")
        }
      />
      <Alert>
        <RiFlaskLine aria-hidden />
        <AlertDescription>{t("demo.code")}</AlertDescription>
      </Alert>

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
        <Link href="/forgot-password" className="text-primary underline-offset-4 hover:underline">
          {t("reset.requestNew")}
        </Link>
      </p>
    </div>
  )
}
