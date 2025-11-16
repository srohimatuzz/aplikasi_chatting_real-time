import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Real-time Chat Application",
  description: "Multiple users chatting in real-time with room support and monitoring",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/logos.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/logos.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/logos.png",
        type: "image/svg+xml",
      },
    ],
    apple: "/logos.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
  <body className={`${_geist.className} ${/* use mono only where needed, but include for availability */ _geistMono.className} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
