"use client"

import { RiFlaskLine } from "@remixicon/react"
import { useTranslations } from "next-intl"

import { useSession } from "@/components/providers/session-provider"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { ROLES, type Role } from "@/lib/roles"

// Demo-only bar for switching roles without real auth. Hidden when
// NEXT_PUBLIC_ROLE_SWITCHER is "false" (set that in production).
export function RoleSwitcher() {
  const { role, signInAs, signOut } = useSession()
  const t = useTranslations("Demo")
  const tr = useTranslations("Roles")

  if (process.env.NEXT_PUBLIC_ROLE_SWITCHER === "false") return null

  return (
    <aside
      aria-label={t("viewAs")}
      className="flex items-center justify-center gap-2 border-b bg-muted px-4 py-1 text-xs text-muted-foreground"
    >
      <RiFlaskLine className="size-3.5" aria-hidden />
      <label htmlFor="role-switcher">{t("viewAs")}</label>
      <NativeSelect
        id="role-switcher"
        size="sm"
        value={role ?? "signed-out"}
        onChange={(e) => {
          const v = e.target.value
          if (v === "signed-out") signOut()
          else signInAs(v as Role)
        }}
      >
        <NativeSelectOption value="signed-out">{t("signedOut")}</NativeSelectOption>
        {ROLES.map((r) => (
          <NativeSelectOption key={r} value={r}>
            {tr(r)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </aside>
  )
}
