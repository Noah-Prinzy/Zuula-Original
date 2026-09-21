"use client"

import { RiFlaskLine } from "@remixicon/react"

import { useSession } from "@/components/providers/session-provider"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { ROLE_LABELS, ROLES, type Role } from "@/lib/roles"

// Demo-only bar for switching roles without real auth. Hidden when
// NEXT_PUBLIC_ROLE_SWITCHER is "false" (set that in production).
export function RoleSwitcher() {
  const { role, signInAs, signOut } = useSession()

  if (process.env.NEXT_PUBLIC_ROLE_SWITCHER === "false") return null

  return (
    <div className="flex items-center justify-center gap-2 border-b bg-muted px-4 py-1 text-xs text-muted-foreground">
      <RiFlaskLine className="size-3.5" aria-hidden />
      <label htmlFor="role-switcher">Demo: view as</label>
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
        <NativeSelectOption value="signed-out">Signed out</NativeSelectOption>
        {ROLES.map((r) => (
          <NativeSelectOption key={r} value={r}>
            {ROLE_LABELS[r]}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  )
}
