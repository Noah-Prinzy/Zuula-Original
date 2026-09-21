import { SignInForm } from "@/components/auth/sign-in-form"

export const metadata = { title: "Sign In" }

type Props = { searchParams: Promise<{ next?: string }> }

export default async function SignInPage({ searchParams }: Props) {
  const { next } = await searchParams
  return <SignInForm next={next} />
}
