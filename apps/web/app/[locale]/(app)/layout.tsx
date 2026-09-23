import { PageSheet } from "@/components/decor/page-sheet"
import { BottomNav } from "@/components/shell/bottom-nav"
import { RoleSwitcher } from "@/components/shell/role-switcher"
import { SectionLayout } from "@/components/shell/section-nav"
import { SiteHeader } from "@/components/shell/site-header"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate flex min-h-svh flex-col">
      <RoleSwitcher />
      <SiteHeader />
      <main id="main" className="flex flex-1 flex-col">
        <PageSheet className="flex-1">
          <SectionLayout>{children}</SectionLayout>
        </PageSheet>
      </main>
      <BottomNav />
    </div>
  )
}
