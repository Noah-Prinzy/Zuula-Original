import { RoleSwitcher } from "@/components/shell/role-switcher"
import { SiteFooter } from "@/components/shell/site-footer"
import { SiteHeader } from "@/components/shell/site-header"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <RoleSwitcher />
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
