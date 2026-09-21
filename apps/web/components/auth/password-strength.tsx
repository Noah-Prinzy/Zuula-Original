import { RiCheckLine, RiCloseLine } from "@remixicon/react"
import { useTranslations } from "next-intl"

import { PASSWORD_MIN, PASSWORD_RULES, passwordStrength } from "@/lib/auth"
import { cn } from "@/lib/utils"

const BAR = ["bg-destructive", "bg-destructive", "bg-verdict-likely-false", "bg-verdict-authentic", "bg-verdict-authentic"]

export function PasswordStrength({ password, id }: { password: string; id?: string }) {
  const { score } = passwordStrength(password)
  const t = useTranslations("Auth.password")

  return (
    <div id={id} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="grid flex-1 grid-cols-4 gap-1" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={cn("h-1", i < score ? BAR[score] : "bg-muted")} />
          ))}
        </div>
        <span className="w-16 text-right text-xs text-muted-foreground" aria-live="polite">
          {password ? t(`strength.${score}`) : ""}
        </span>
      </div>
      <ul className="grid gap-1 text-xs sm:grid-cols-2">
        {PASSWORD_RULES.map((r) => {
          const ok = r.test(password)
          return (
            <li key={r.id} className={cn("flex items-center gap-1", ok ? "text-verdict-authentic" : "text-muted-foreground")}>
              {ok ? <RiCheckLine className="size-3.5" aria-hidden /> : <RiCloseLine className="size-3.5" aria-hidden />}
              {t(`rules.${r.id}`, { min: PASSWORD_MIN })}
              <span className="sr-only">{ok ? t("met") : t("notMet")}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
