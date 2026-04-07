import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Link from "next/link";
import Script from "next/script";

const GA_ID = "G-GRJR3SDJD7";
const ADS_ID = "ca-pub-7559044648994834";

export const metadata: Metadata = {
  title: "MoneyMath – Free Financial Calculators",
  description:
    "Free financial calculators for real life. Powerball payout after taxes, investment compound interest, and more. Fast, accurate, no fluff.",
  keywords:
    "financial calculator, powerball calculator, investment calculator, compound interest, lottery tax calculator",
  verification: {
    google: "QfSXI5Z0_CQg8ZC8vLC64FhNgHIbxL1kXsjJej5h0JQ",
  },
  openGraph: {
    title: "MoneyMath – Free Financial Calculators",
    description: "Free financial calculators for real life.",
    type: "website",
  },
  other: {
    "google-adsense-account": `ca-pub-7559044648994834`,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="google-adsense-account" content={ADS_ID} />
        {/* GA4 — in <head> so Google's tag detector finds it in raw HTML */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`,
          }}
        />
      </head>
      <body className="bg-gray-50 min-h-screen">
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS_ID}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Nav />
        {children}
        <footer className="border-t border-gray-100 mt-8 py-6 text-center">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} MoneyMath &nbsp;·&nbsp;{" "}
            <Link href="/privacy" className="hover:text-gray-600 underline">Privacy Policy</Link>
          </p>
        </footer>
      </body>
    </html>
  );
}
