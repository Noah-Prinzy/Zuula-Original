import type { MetadataRoute } from "next"
import { getTranslations } from "next-intl/server"

// Installable PWA (spec §3, §7.3). Icons are CREST's, in public/brand.
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations("Pwa")

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
