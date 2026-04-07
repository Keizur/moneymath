import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <Nav />
        {children}
      </body>
    </html>
  );
}
