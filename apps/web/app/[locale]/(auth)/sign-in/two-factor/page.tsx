import { getTranslations } from "next-intl/server"

import { TwoFactorForm } from "@/components/auth/two-factor-form"

export async function generateMetadata() {
  const t = await getTranslations("Auth.meta")
  return { title: t("twoFactor") }
}

export default function TwoFactorPage() {
  return <TwoFactorForm />
}
