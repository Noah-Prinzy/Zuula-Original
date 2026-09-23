"use client"

import { RiFlaskLine } from "@remixicon/react"
import { useTranslations } from "next-intl"

import { useSession } from "@/components/providers/session-provider"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { ROLES, type Role } from "@/lib/roles"

// Role preview, not sign-in: while nobody is signed in, look at the role-gated screens (still
// on mock content) as a sample user. It never reaches the API. Hidden once someone really
// signs in (their own role applies everywhere), and unless NEXT_PUBLIC_ROLE_SWITCHER is "true".
export function RoleSwitcher() {
  const { role, ready, source, previewEnabled, previewAs } = useSession()
  const t = useTranslations("Demo")
  const tr = useTranslations("Roles")

  if (!previewEnabled || !ready || source === "account") return null

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-b bg-muted px-4 py-1 text-xs text-muted-foreground">
      <RiFlaskLine className="size-3.5" aria-hidden />
      <label htmlFor="role-switcher">{t("previewAs")}</label>
      <NativeSelect
        id="role-switcher"
        size="sm"
        value={role ?? "signed-out"}
        aria-describedby="role-switcher-note"
        onChange={(e) => {
          const v = e.target.value
          previewAs(v === "signed-out" ? null : (v as Role))
        }}
      >
        <NativeSelectOption value="signed-out">{t("signedOut")}</NativeSelectOption>
        {ROLES.map((r) => (
          <NativeSelectOption key={r} value={r}>
            {tr(r)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <span id="role-switcher-note">{t("previewNote")}</span>
    </div>
  )
}
