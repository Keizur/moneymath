import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Powerball Payout Calculator – Real After-Tax Take Home | MoneyMath",
  description:
    "Calculate your real Powerball payout after federal and state taxes. See exactly what you'd take home with lump sum vs annuity for all 50 states. Free, fast, and accurate.",
  keywords:
    "powerball payout calculator, lottery after tax, powerball lump sum, powerball annuity, lottery tax calculator",
  openGraph: {
    title: "Powerball Payout Calculator | MoneyMath",
    description: "See exactly what you'd take home after taxes.",
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
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
