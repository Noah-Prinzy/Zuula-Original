"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { RiLockLine } from "@remixicon/react"

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
import { hasAnyRole, ROLE_LABELS, type Role } from "@/lib/roles"

// Client-side gate for UX only. Real enforcement happens in the API (Phase 2/3).
export function RoleGate({
  allow,
  children,
}: {
  allow: readonly Role[]
  children: React.ReactNode
}) {
  const { role, ready } = useSession()
  const pathname = usePathname()

  if (!ready) return <Skeleton className="h-64 w-full" />
  if (hasAnyRole(role, allow)) return <>{children}</>

  const needed = allow.map((r) => ROLE_LABELS[r]).join(" or ")

  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RiLockLine aria-hidden />
        </EmptyMedia>
        <EmptyTitle>Access restricted</EmptyTitle>
        <EmptyDescription>This area requires {needed} access.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {role ? (
          <Button variant="outline" asChild>
            <Link href="/">Back to home</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href={`/sign-in?next=${encodeURIComponent(pathname)}`}>Sign In</Link>
          </Button>
        )}
      </EmptyContent>
    </Empty>
  )
}
