import type { Metadata } from "next";
import MortgageCalculator from "@/components/MortgageCalculator";

export const metadata: Metadata = {
  title: "Mortgage Calculator – Monthly Payment & Total Interest | MoneyMath",
  description:
    "Calculate your monthly mortgage payment, total interest paid, and true cost of your home loan. Compare 15-year vs 30-year and see the full amortization breakdown.",
  keywords:
    "mortgage calculator, monthly mortgage payment, home loan calculator, 15 vs 30 year mortgage, mortgage interest calculator, amortization schedule",
  openGraph: {
    title: "Mortgage Calculator | MoneyMath",
    description: "See your true monthly payment and total cost of your home loan.",
    type: "website",
  },
};

export default function MortgagePage() {
  return <MortgageCalculator />;
}
