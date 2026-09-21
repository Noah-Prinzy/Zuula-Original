import { Logo } from "@/components/shell/logo"
import { RoleSwitcher } from "@/components/shell/role-switcher"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-muted/40">
      <RoleSwitcher />
      <main id="main" className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
        <Logo className="text-lg" />
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  )
}
