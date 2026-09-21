"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { RiFlaskLine, RiLockPasswordLine } from "@remixicon/react"
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
import { clearPendingAuth, isDemoCodeValid, maskIdentifier, resetSchema } from "@/lib/auth"

type Values = z.infer<typeof resetSchema>

// FR-AUTH-06: set a new password using the emailed/SMS code.
export function ResetPasswordForm() {
  const router = useRouter()
  const pending = usePendingAuth()
  const form = useForm<Values>({
    resolver: zodResolver(resetSchema),
    defaultValues: { code: "", password: "", confirm: "" },
  })
  const { control, handleSubmit, formState, setError } = form
  const password = useWatch({ control, name: "password" })

  async function onSubmit(v: Values) {
    await new Promise((r) => setTimeout(r, 600))
    if (!isDemoCodeValid(v.code)) {
      setError("code", { message: "That code is incorrect or has expired." })
      return
    }
    clearPendingAuth()
    toast.success("Password updated", { description: "Sign in with your new password." })
    startNavigationProgress()
    router.push("/sign-in")
  }

  return (
    <div className="flex flex-col gap-6">
      <AuthHeading
        icon={RiLockPasswordLine}
        title="Set a new password"
        description={
          pending ? (
            <>
              Enter the code sent to <span className="font-medium text-foreground">{maskIdentifier(pending.identifier)}</span>{" "}
              and choose a new password.
            </>
          ) : (
            "Enter the reset code we sent you and choose a new password."
          )
        }
      />
      <Alert>
        <RiFlaskLine aria-hidden />
        <AlertDescription>Demo: any 6 digits work, except 000000.</AlertDescription>
      </Alert>

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Controller
          control={control}
          name="code"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="reset-code">Reset code</FieldLabel>
              <CodeInput
                id="reset-code"
                value={field.value}
                onChange={field.onChange}
                invalid={fieldState.invalid}
                disabled={formState.isSubmitting}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="reset-password">New password</FieldLabel>
              <PasswordInput
                {...field}
                id="reset-password"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
                aria-describedby="reset-password-strength"
                className="h-10"
              />
              <PasswordStrength id="reset-password-strength" password={password} />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="confirm"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="reset-confirm">Confirm new password</FieldLabel>
              <PasswordInput
                {...field}
                id="reset-confirm"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
                className="h-10"
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Button type="submit" size="lg" className="h-10" disabled={formState.isSubmitting}>
          {formState.isSubmitting && <Spinner />}
          {formState.isSubmitting ? "Updating…" : "Update password"}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        No code?{" "}
        <Link href="/forgot-password" className="text-primary underline-offset-4 hover:underline">
          Request a new one
        </Link>
      </p>
    </div>
  )
}
