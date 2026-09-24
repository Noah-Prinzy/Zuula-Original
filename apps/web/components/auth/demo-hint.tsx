"use client"

import { RiFlaskLine } from "@remixicon/react"
import { useTranslations } from "next-intl"

import { useSession } from "@/components/providers/session-provider"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Explains the demo sign-in (lib/demo-auth.ts) on the auth forms. Renders nothing when the
// site talks to the real API.
export function DemoHint({ kind }: { kind: "roles" | "code" }) {
  const { demo } = useSession()
  const t = useTranslations("Auth.demo")
  if (!demo) return null
  return (
    <Alert>
      <RiFlaskLine aria-hidden />
      <AlertDescription>
        {kind === "roles"
          ? t.rich("roles", { code: (chunks) => <code className="font-mono">{chunks}</code> })
          : t("code")}
      </AlertDescription>
    </Alert>
  )
}
