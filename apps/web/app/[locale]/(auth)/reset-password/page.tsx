import { getTranslations } from "next-intl/server"

import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export async function generateMetadata() {
  const t = await getTranslations("Auth.meta")
  return { title: t("reset") }
}

export default function ResetPasswordPage() {
  return <ResetPasswordForm />
}
