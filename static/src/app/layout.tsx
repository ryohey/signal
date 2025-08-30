import { GoogleAnalytics } from "@next/third-parties/google"
import { Inter } from "next/font/google"
import { Provider } from "./Provider"
import "./carbon.css"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Provider>
      <html lang="en">
        <GoogleAnalytics gaId="G-C4N96XS293" />
        <head>
          <link rel="canonical" href="https://signalmidi.app/" />
          <link
            rel="alternate"
            hrefLang="x-default"
            href="https://signalmidi.app/"
          />
          <link
            rel="alternate"
            hrefLang="en"
            href="https://signalmidi.app/?lang=en"
          />
          <link
            rel="alternate"
            hrefLang="fr"
            href="https://signalmidi.app/?lang=fr"
          />
          <link
            rel="alternate"
            hrefLang="ja"
            href="https://signalmidi.app/?lang=ja"
          />
          <link
            rel="alternate"
            hrefLang="zh"
            href="https://signalmidi.app/?lang=zh"
          />
          <link
            rel="alternate"
            hrefLang="zh-cmn-Hans"
            href="https://signalmidi.app/?lang=zh-Hans"
          />
          <link
            rel="alternate"
            hrefLang="zh-cmn-Hant"
            href="https://signalmidi.app/?lang=zh-Hant"
          />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        </head>
        <body className={inter.className}>{children}</body>
      </html>
    </Provider>
  )
}
