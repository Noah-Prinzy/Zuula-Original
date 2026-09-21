import { RoleGate } from "@/components/shell/role-gate"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RoleGate allow={["journalist", "admin"]}>{children}</RoleGate>
}
