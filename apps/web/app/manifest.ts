import type { MetadataRoute } from "next"
import { cookies } from "next/headers"
import { getTranslations } from "next-intl/server"

import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from "@/i18n/config"

// Installable PWA (spec §3, §7.3). Icons are CREST's, in public/brand.
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  // Served outside app/[locale] (and skipped by proxy.ts), so read the language cookie
  // directly: the installed app's name follows the language the user picked.
  const value = (await cookies()).get(LOCALE_COOKIE)?.value
  const t = await getTranslations({ locale: isLocale(value) ? value : DEFAULT_LOCALE, namespace: "Pwa" })

  return {
    id: "/",
    name: t("name"),
    short_name: t("shortName"),
    description: t("description"),
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#C70036",
    background_color: "#FFFFFF",
    categories: ["news", "utilities"],
    icons: [
      {
        src: "/brand/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: t("shortcutVerify"), url: "/verify" },
      { name: t("shortcutLibrary"), url: "/fact-checks" },
      { name: t("shortcutSaved"), url: "/offline" },
    ],
  }
}
