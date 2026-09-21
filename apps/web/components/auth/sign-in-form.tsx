"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { RiFlaskLine } from "@remixicon/react"
import { useTranslations } from "next-intl"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import type { z } from "zod"

import { AuthHeading } from "@/components/auth/auth-heading"
import { PasswordInput } from "@/components/auth/password-input"
import { SocialButtons } from "@/components/auth/social-buttons"
import { useSession } from "@/components/providers/session-provider"
import { startNavigationProgress } from "@/components/shell/route-progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useValidationMessage } from "@/hooks/use-validation-message"
import {
  demoRoleFor,
  homeFor,
  needsTwoFactor,
  safeNext,
  setPendingAuth,
  signInSchema,
} from "@/lib/auth"

type Values = z.infer<typeof signInSchema>

export function SignInForm({ next }: { next?: string }) {
  const router = useRouter()
  const { signInAs } = useSession()
  const t = useTranslations("Auth")
  const tr = useTranslations("Roles")
  const v = useValidationMessage()
  const form = useForm<Values>({
    resolver: zodResolver(signInSchema),
    defaultValues: { identifier: "", password: "", remember: true },
  })
  const { control, handleSubmit, formState } = form

  async function onSubmit(values: Values) {
    await new Promise((r) => setTimeout(r, 500)) // mock network
    const role = demoRoleFor(values.identifier)
    startNavigationProgress()

    if (needsTwoFactor(role)) {
      setPendingAuth({ role, identifier: values.identifier, next: safeNext(next, homeFor(role)) })
      router.push("/sign-in/two-factor")
      return
    }
    signInAs(role)
    toast.success(t("signIn.toastTitle"), { description: t("signIn.toastBody", { role: tr(role) }) })
    router.push(safeNext(next, homeFor(role)))
  }

  return (
    <div className="flex flex-col gap-6">
      <AuthHeading title={t("signIn.title")} description={t("signIn.description")} />

      <Alert>
        <RiFlaskLine aria-hidden />
        <AlertDescription>
          {t.rich("demo.roles", { code: (chunks) => <code className="font-mono">{chunks}</code> })}
        </AlertDescription>
      </Alert>

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Controller
          control={control}
          name="identifier"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="signin-identifier">{t("fields.identifier")}</FieldLabel>
              <Input
                {...field}
                id="signin-identifier"
                autoComplete="username"
                inputMode="email"
                aria-invalid={fieldState.invalid}
                placeholder={t("fields.identifierPlaceholder")}
                className="h-10"
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
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="signin-password">{t("fields.password")}</FieldLabel>
                <Link href="/forgot-password" className="text-xs text-primary underline-offset-4 hover:underline">
                  {t("signIn.forgot")}
                </Link>
              </div>
              <PasswordInput
                {...field}
                id="signin-password"
                autoComplete="current-password"
                aria-invalid={fieldState.invalid}
                className="h-10"
              />
              <FieldError>{v(fieldState.error?.message)}</FieldError>
            </Field>
          )}
        />
        <Controller
          control={control}
          name="remember"
          render={({ field }) => (
            <Field orientation="horizontal">
              <Checkbox
                id="signin-remember"
                checked={field.value}
                onCheckedChange={(c) => field.onChange(c === true)}
              />
              <FieldLabel htmlFor="signin-remember" className="font-normal">
                {t("signIn.remember")}
              </FieldLabel>
            </Field>
          )}
        />
        <Button type="submit" size="lg" className="h-10" disabled={formState.isSubmitting}>
          {formState.isSubmitting && <Spinner />}
          {formState.isSubmitting ? t("signIn.submitting") : t("signIn.submit")}
        </Button>
      </form>

      <SocialButtons disabled={formState.isSubmitting} />

      <p className="text-center text-sm text-muted-foreground">
        {t("signIn.newHere")}{" "}
        <Link
          href={next ? `/sign-up?next=${encodeURIComponent(next)}` : "/sign-up"}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("signIn.createAccount")}
        </Link>
      </p>
    </div>
  )
}
