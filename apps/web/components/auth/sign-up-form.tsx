"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { safeNext, setPendingAuth, signUpSchema } from "@/lib/auth"

type Values = z.infer<typeof signUpSchema>

export function SignUpForm({ next }: { next?: string }) {
  const router = useRouter()
  const form = useForm<Values>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", identifier: "", password: "", confirm: "", consent: false },
  })
  const { control, handleSubmit, formState } = form
  const password = useWatch({ control, name: "password" })

  async function onSubmit(v: Values) {
    await new Promise((r) => setTimeout(r, 600)) // mock network
    setPendingAuth({ role: "public", identifier: v.identifier, name: v.name, next: safeNext(next, "/") })
    startNavigationProgress()
    router.push("/sign-up/verify")
  }

  return (
    <div className="flex flex-col gap-6">
      <AuthHeading
        title="Create your account"
        description="Free for everyone. Rate verdicts, follow topics and track your checks."
      />

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="signup-name">Full name</FieldLabel>
              <Input {...field} id="signup-name" autoComplete="name" aria-invalid={fieldState.invalid} className="h-10" />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="identifier"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="signup-identifier">Email or phone</FieldLabel>
              <Input
                {...field}
                id="signup-identifier"
                autoComplete="username"
                aria-invalid={fieldState.invalid}
                placeholder="you@example.com or 07XX XXX XXX"
                className="h-10"
              />
              <FieldDescription>We&apos;ll send a code to confirm it.</FieldDescription>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="signup-password">Password</FieldLabel>
              <PasswordInput
                {...field}
                id="signup-password"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
                aria-describedby="signup-password-strength"
                className="h-10"
              />
              <PasswordStrength id="signup-password-strength" password={password} />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="confirm"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="signup-confirm">Confirm password</FieldLabel>
              <PasswordInput
                {...field}
                id="signup-confirm"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
                className="h-10"
              />
              <FieldError errors={[fieldState.error]} />
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
                  I agree to the{" "}
                  <Link href="/legal/terms" className="text-primary underline underline-offset-2">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/legal/privacy" className="text-primary underline underline-offset-2">
                    Privacy Policy
                  </Link>
                  , and to Zuula processing my data under the Data Protection and Privacy Act, 2019.
                </FieldLabel>
              </div>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Button type="submit" size="lg" className="h-10" disabled={formState.isSubmitting}>
          {formState.isSubmitting && <Spinner />}
          {formState.isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <SocialButtons disabled={formState.isSubmitting} />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in"}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
