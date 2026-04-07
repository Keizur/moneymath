import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Link from "next/link";
import Script from "next/script";

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
    "google-adsense-account": "ca-pub-7559044648994834",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7559044648994834"
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
