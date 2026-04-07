import type { Metadata } from "next";
import LotteryCalculator from "@/components/LotteryCalculator";

export const metadata: Metadata = {
  title: "Powerball Payout Calculator – Real After-Tax Take Home | MoneyMath",
  description:
    "Calculate your real Powerball payout after federal and state taxes. See exactly what you'd take home with lump sum vs annuity for all 50 states. Free, fast, and accurate.",
  keywords:
    "powerball payout calculator, lottery after tax, powerball lump sum, powerball annuity, lottery tax calculator, powerball take home, powerball after taxes",
  openGraph: {
    title: "Powerball Payout Calculator | MoneyMath",
    description: "See exactly what you'd take home after federal and state taxes.",
    type: "website",
  },
};

const faqs = [
  {
    question: "How much do you actually take home from a Powerball jackpot?",
    answer:
      "It depends on the jackpot size, your state, and whether you take the lump sum or annuity. On a $500 million jackpot, the lump sum cash value is roughly $240 million. After the 37% federal tax, you're left with about $151 million before state taxes. In a no-tax state like Florida or Texas, that's your final take-home. In a high-tax state like New York (10.9%), it drops to around $125 million.",
  },
  {
    question: "What is the federal tax rate on Powerball winnings?",
    answer:
      "The federal tax rate on lottery winnings over $1 million is 37% — the top marginal bracket. The IRS automatically withholds 24% at the time of payout. You'll owe the remaining 13% when you file your tax return. On large jackpots, this difference can be tens of millions of dollars, so plan for it.",
  },
  {
    question: "Should I take the Powerball lump sum or annuity?",
    answer:
      "The lump sum pays roughly 60% of the advertised jackpot immediately, then gets taxed. The annuity pays the full advertised amount over 30 annual payments, also taxed each year. Most financial advisors favor the lump sum for disciplined investors because money invested today compounds over 30 years faster than the annuity schedule. The annuity offers more total dollars but less flexibility.",
  },
  {
    question: "Which states have no state tax on Powerball winnings?",
    answer:
      "Eight states have no state income tax on lottery winnings: California, Florida, New Hampshire, South Dakota, Tennessee, Texas, Washington, and Wyoming. Delaware and Pennsylvania also have no state tax specifically on lottery prizes. Winning in one of these states saves you 5–10% compared to high-tax states.",
  },
  {
    question: "What is the cash value of the Powerball jackpot?",
    answer:
      "The 'cash value' (also called the lump sum option) is typically around 60% of the advertised jackpot. The advertised amount is the total if paid as an annuity over 30 years. The cash value represents what Powerball has actually collected and invested — the amount available for immediate payout before taxes.",
  },
  {
    question: "How accurate is this Powerball payout calculator?",
    answer:
      "This calculator uses the 2025 federal top marginal rate of 37% and current state income tax rates for all 50 states. It accounts for the lump sum cash value reduction and both federal and state withholding. Results are estimates — your actual tax situation (credits, deductions, other income) can affect the final amount.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

const calculatorSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Powerball Payout Calculator",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description:
    "Calculate your real Powerball payout after federal and state taxes for all 50 states. Compare lump sum vs annuity take-home.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function PowerballPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(calculatorSchema) }}
      />
      <LotteryCalculator />

      {/* FAQ Section — static content for SEO */}
      <div className="max-w-2xl mx-auto px-4 pb-14">
        <h2 className="text-xl font-extrabold text-gray-900 mb-6">
          Powerball Payout — Common Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.question} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-2">{faq.question}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
