import { PageSheet } from "@/components/decor/page-sheet"
import { RouteBackdrop } from "@/components/decor/route-backdrop"
import { RoleSwitcher } from "@/components/shell/role-switcher"
import { SectionLayout } from "@/components/shell/section-nav"
import { SiteFooter } from "@/components/shell/site-footer"
import { SiteHeader } from "@/components/shell/site-header"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate flex min-h-svh flex-col">
      {/* One background photo per section; the working area is a solid sheet above it. */}
      <RouteBackdrop />
      <RoleSwitcher />
      <SiteHeader />
      <main id="main" className="flex flex-1 flex-col pt-6 md:pt-10">
        <PageSheet className="flex-1">
          <SectionLayout>{children}</SectionLayout>
        </PageSheet>
      </main>
      <div className="bg-background">
        <SiteFooter />
      </div>
    </div>
  )
}
