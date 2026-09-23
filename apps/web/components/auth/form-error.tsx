import { RiErrorWarningLine } from "@remixicon/react"

import { Alert, AlertDescription } from "@/components/ui/alert"

// A failed API call on an auth form (wrong password, expired code, API unreachable…).
export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <Alert variant="destructive">
      <RiErrorWarningLine aria-hidden />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
