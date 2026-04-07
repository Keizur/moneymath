import type { Metadata } from "next";
import SalaryCalculator from "@/components/SalaryCalculator";

export const metadata: Metadata = {
  title: "Salary Calculator – Take-Home Pay After Taxes | MoneyMath",
  description:
    "Calculate your real take-home pay after federal income tax, Social Security, Medicare, and state taxes. Enter your salary or hourly rate and see an exact per-paycheck breakdown.",
  keywords:
    "salary calculator, take-home pay calculator, paycheck calculator, after tax salary, net pay calculator, salary after taxes, income tax calculator",
  openGraph: {
    title: "Salary Calculator – What's Your Real Take-Home Pay? | MoneyMath",
    description:
      "See exactly what hits your bank account after federal, state, and FICA taxes.",
    type: "website",
  },
};

export default function SalaryPage() {
  return <SalaryCalculator />;
}
