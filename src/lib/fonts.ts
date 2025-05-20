import { Geist, Geist_Mono, Unbounded } from "next/font/google"

import { cn } from "@/lib/utils"

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const fontUnbounded = Unbounded({
  subsets: ["latin"],
  variable: "--font-unbounded",
})
export const fontUnboundedCN = fontUnbounded.className

export const fontVariables = cn(
  fontSans.variable,
  fontMono.variable,
  fontUnbounded.variable,
)
