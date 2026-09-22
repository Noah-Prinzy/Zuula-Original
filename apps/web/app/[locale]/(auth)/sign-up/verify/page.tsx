import { getTranslations } from "next-intl/server"

import { VerifyAccountForm } from "@/components/auth/verify-account-form"

export async function generateMetadata() {
  const t = await getTranslations("Auth.meta")
  return { title: t("verify") }
}

export default function VerifyAccountPage() {
  return <VerifyAccountForm />
}
