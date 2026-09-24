"use client"

import Link from "next/link"
import { RiLockLine } from "@remixicon/react"
import { useTranslations } from "next-intl"

import { useSession } from "@/components/providers/session-provider"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { hasAnyRole, type Role } from "@/lib/roles"
import { usePagePath } from "@/hooks/use-page-path"

// Client-side gate for UX only. Real enforcement happens in the API (Phase 2/3).
export function RoleGate({
  allow,
  children,
}: {
  allow: readonly Role[]
  children: React.ReactNode
}) {
  const { role, ready } = useSession()
  const pathname = usePagePath()
  const t = useTranslations("RoleGate")
  const tc = useTranslations("Common")
  const tr = useTranslations("Roles")

  if (!ready) return <Skeleton className="h-64 w-full" />
  if (hasAnyRole(role, allow)) return <>{children}</>

  const needed = allow.map((r) => tr(r)).join(` ${t("or")} `)

  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RiLockLine aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{t("title")}</EmptyTitle>
        <EmptyDescription>{t("body", { roles: needed })}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {role ? (
          <Button variant="outline" asChild>
            <Link href="/">{tc("backToHome")}</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href={`/sign-in?next=${encodeURIComponent(pathname)}`}>{tc("signIn")}</Link>
          </Button>
        )}
      </EmptyContent>
    </Empty>
  )
}
