import { getTranslations } from "next-intl/server"

import { SignUpForm } from "@/components/auth/sign-up-form"

export async function generateMetadata() {
  const t = await getTranslations("Auth.meta")
  return { title: t("signUp") }
}

type Props = { searchParams: Promise<{ next?: string }> }

export default async function SignUpPage({ searchParams }: Props) {
  const { next } = await searchParams
  return <SignUpForm next={next} />
}
