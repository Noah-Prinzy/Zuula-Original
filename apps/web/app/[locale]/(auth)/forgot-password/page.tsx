import { getTranslations } from "next-intl/server"

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export async function generateMetadata() {
  const t = await getTranslations("Auth.meta")
  return { title: t("forgot") }
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}
