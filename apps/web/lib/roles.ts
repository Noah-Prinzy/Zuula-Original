// User roles from the spec (FR-AUTH-02). Order matters: later roles inherit earlier access.
export const ROLES = ["public", "journalist", "expert", "admin"] as const

export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  public: "Public User",
  journalist: "Verified Journalist",
  expert: "Expert Reviewer",
  admin: "Administrator",
}

export function hasAnyRole(role: Role | null, allowed?: readonly Role[]) {
  if (!allowed || allowed.length === 0) return true
  return role !== null && allowed.includes(role)
}
