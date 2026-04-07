import type { Metadata } from "next";
import CarLoanCalculator from "@/components/CarLoanCalculator";

export const metadata: Metadata = {
  title: "Car Loan Calculator – Monthly Payment & Total Cost | MoneyMath",
  description:
    "Calculate your monthly car payment and total auto loan cost. Enter vehicle price, down payment, trade-in value, and interest rate to see the full picture.",
  keywords:
    "car loan calculator, auto loan calculator, monthly car payment, car loan interest, vehicle financing calculator",
  openGraph: {
    title: "Car Loan Calculator | MoneyMath",
    description: "See your monthly payment and total cost of your auto loan.",
    type: "website",
  },
};

export default function CarLoanPage() {
  return <CarLoanCalculator />;
}
