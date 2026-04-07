import type { Metadata } from "next";
import InvestmentCalculator from "@/components/InvestmentCalculator";

export const metadata: Metadata = {
  title: "Investment Calculator – Compound Interest & Retirement Growth | MoneyMath",
  description:
    "See exactly how much your investments will grow over time. Enter your age, starting amount, monthly contributions, and return rate to calculate your retirement portfolio.",
  keywords:
    "investment calculator, compound interest calculator, retirement calculator, how much will my money grow, S&P 500 calculator, monthly contribution calculator",
  openGraph: {
    title: "Investment Calculator | MoneyMath",
    description: "See what consistent investing actually builds over time.",
    type: "website",
  },
};

export default function InvestmentPage() {
  return <InvestmentCalculator />;
}
