import { RouteBackdrop } from "@/components/decor/route-backdrop"
import { HideOnHome } from "@/components/home/hide-on-home"
import { RoleSwitcher } from "@/components/shell/role-switcher"
import { SiteFooter } from "@/components/shell/site-footer"
import { SiteHeader } from "@/components/shell/site-header"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative isolate flex min-h-svh flex-col">
      {/* The page's background photo; pages put body content on a PageSheet above it. */}
      <RouteBackdrop />
      <RoleSwitcher />
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <HideOnHome>
        <div className="bg-background">
          <SiteFooter />
        </div>
      </HideOnHome>
    </div>
  )
}
