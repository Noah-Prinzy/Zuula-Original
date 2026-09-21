import { cookies } from "next/headers"

import { AppHeader } from "@/components/shell/app-header"
import { AppSidebar } from "@/components/shell/app-sidebar"
import { RoleSwitcher } from "@/components/shell/role-switcher"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Remember collapsed/expanded state across reloads.
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset>
        <RoleSwitcher />
        <AppHeader />
        <main id="main" className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
