import { SignUpForm } from "@/components/auth/sign-up-form"

export const metadata = { title: "Sign Up" }

type Props = { searchParams: Promise<{ next?: string }> }

export default async function SignUpPage({ searchParams }: Props) {
  const { next } = await searchParams
  return <SignUpForm next={next} />
}
