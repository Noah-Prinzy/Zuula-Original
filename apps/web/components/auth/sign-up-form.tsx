"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { Controller, useForm, useWatch } from "react-hook-form"
import type { z } from "zod"

import { AuthHeading } from "@/components/auth/auth-heading"
import { PasswordInput } from "@/components/auth/password-input"
import { PasswordStrength } from "@/components/auth/password-strength"
import { SocialButtons } from "@/components/auth/social-buttons"
import { startNavigationProgress } from "@/components/shell/route-progress"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useValidationMessage } from "@/hooks/use-validation-message"
import { safeNext, setPendingAuth, signUpSchema } from "@/lib/auth"

type Values = z.infer<typeof signUpSchema>

export function SignUpForm({ next }: { next?: string }) {
  const router = useRouter()
  const t = useTranslations("Auth")
  const v = useValidationMessage()
  const form = useForm<Values>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", identifier: "", password: "", confirm: "", consent: false },
  })
  const { control, handleSubmit, formState } = form
  const password = useWatch({ control, name: "password" })

  async function onSubmit(values: Values) {
    await new Promise((r) => setTimeout(r, 600)) // mock network
    setPendingAuth({ role: "public", identifier: values.identifier, name: values.name, next: safeNext(next, "/") })
    startNavigationProgress()
    router.push("/sign-up/verify")
  }

  return (
    <div className="flex flex-col gap-6">
      <AuthHeading title={t("signUp.title")} description={t("signUp.description")} />

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="signup-name">{t("fields.fullName")}</FieldLabel>
              <Input {...field} id="signup-name" autoComplete="name" aria-invalid={fieldState.invalid} className="h-10" />
              <FieldError>{v(fieldState.error?.message)}</FieldError>
            </Field>
          )}
        />
        <Controller
          control={control}
          name="identifier"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="signup-identifier">{t("fields.identifier")}</FieldLabel>
              <Input
                {...field}
                id="signup-identifier"
                autoComplete="username"
                aria-invalid={fieldState.invalid}
                placeholder={t("fields.identifierPlaceholder")}
                className="h-10"
              />
              <FieldDescription>{t("signUp.identifierHint")}</FieldDescription>
              <FieldError>{v(fieldState.error?.message)}</FieldError>
            </Field>
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="signup-password">{t("fields.password")}</FieldLabel>
              <PasswordInput
                {...field}
                id="signup-password"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
                aria-describedby="signup-password-strength"
                className="h-10"
              />
              <PasswordStrength id="signup-password-strength" password={password} />
              <FieldError>{v(fieldState.error?.message)}</FieldError>
            </Field>
          )}
        />
        <Controller
          control={control}
          name="confirm"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="signup-confirm">{t("fields.confirmPassword")}</FieldLabel>
              <PasswordInput
                {...field}
                id="signup-confirm"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
                className="h-10"
              />
              <FieldError>{v(fieldState.error?.message)}</FieldError>
            </Field>
          )}
        />
        <Controller
          control={control}
          name="consent"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="signup-consent"
                  checked={field.value}
                  onCheckedChange={(c) => field.onChange(c === true)}
                  aria-invalid={fieldState.invalid}
                  className="mt-0.5"
                />
                <FieldLabel htmlFor="signup-consent" className="block font-normal leading-snug">
                  {t.rich("signUp.consent", {
                    terms: (chunks) => (
                      <Link href="/legal/terms" className="text-primary underline underline-offset-2">
                        {chunks}
                      </Link>
                    ),
                    privacy: (chunks) => (
                      <Link href="/legal/privacy" className="text-primary underline underline-offset-2">
                        {chunks}
                      </Link>
                    ),
                  })}
                </FieldLabel>
              </div>
              <FieldError>{v(fieldState.error?.message)}</FieldError>
            </Field>
          )}
        />
        <Button type="submit" size="lg" className="h-10" disabled={formState.isSubmitting}>
          {formState.isSubmitting && <Spinner />}
          {formState.isSubmitting ? t("signUp.submitting") : t("signUp.submit")}
        </Button>
      </form>

      <SocialButtons disabled={formState.isSubmitting} />

      <p className="text-center text-sm text-muted-foreground">
        {t("signUp.haveAccount")}{" "}
        <Link
          href={next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in"}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("signUp.signIn")}
        </Link>
      </p>
    </div>
  )
}
