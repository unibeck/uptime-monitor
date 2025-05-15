import { PROD_FQDN } from "@/lib/constants"

export const siteConfig = {
  name: "SolStatus",
  url: `https://${PROD_FQDN}`,
  ogImage: `https://${PROD_FQDN}/og.jpg`,
  description:
    "An uptime monitoring service that is easy and cheap to run at scale. Create endpoint checks for uptime, latency, and status code. Supports OpsGenie, for alerts when there are two or more consecutive failures.",
  links: {
    twitter: "https://x.com/SolBeckman_",
    github: "https://github.com/unibeck/solstatus",
  },
  defaultTheme: "mono-scaled",
}

export type SiteConfig = typeof siteConfig

export const META_THEME_COLORS = {
  light: "#ffffff",
  dark: "#09090b",
}
