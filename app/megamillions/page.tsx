import type { Metadata } from "next";
import MegaMillionsCalculator from "@/components/MegaMillionsCalculator";

export const metadata: Metadata = {
  title: "Mega Millions Payout Calculator – Real After-Tax Take Home | MoneyMath",
  description:
    "Calculate your real Mega Millions payout after federal and state taxes. See exactly what you'd take home with lump sum vs annuity for all 50 states. Free, fast, and accurate.",
  keywords:
    "mega millions payout calculator, mega millions after tax, mega millions lump sum, mega millions annuity, lottery tax calculator, mega millions take home",
  openGraph: {
    title: "Mega Millions Payout Calculator | MoneyMath",
    description: "See exactly what you'd take home after federal and state taxes.",
    type: "website",
  },
};

const faqs = [
  {
    question: "How much do you actually take home from a Mega Millions jackpot?",
    answer:
      "On a $500 million Mega Millions jackpot, the lump sum cash value is roughly $240 million. After the 37% federal tax, you're left with about $151 million before state taxes. In a no-tax state like Florida or Texas, that's your final take-home. In a high-tax state like New York (10.9%), it drops to around $125 million.",
  },
  {
    question: "What is the federal tax rate on Mega Millions winnings?",
    answer:
      "The federal tax rate on lottery winnings over $1 million is 37% — the top marginal bracket. The IRS automatically withholds 24% at the time of payout. You'll owe the remaining 13% when you file your tax return. On large jackpots, this difference can be tens of millions of dollars.",
  },
  {
    question: "Should I take the Mega Millions lump sum or annuity?",
    answer:
      "The lump sum pays roughly 60% of the advertised jackpot immediately, then gets taxed. The annuity pays the full advertised amount over 30 annual payments, also taxed each year. Most financial advisors favor the lump sum for disciplined investors because money invested today compounds over 30 years faster than the annuity schedule.",
  },
  {
    question: "Which states have no state tax on Mega Millions winnings?",
    answer:
      "Eight states have no state income tax on lottery winnings: California, Florida, New Hampshire, South Dakota, Tennessee, Texas, Washington, and Wyoming. Delaware and Pennsylvania also have no state tax specifically on lottery prizes.",
  },
  {
    question: "When are Mega Millions drawings?",
    answer:
      "Mega Millions drawings are held every Tuesday and Friday at 11:00 PM ET. Tickets must be purchased before 10:45 PM ET on the night of the drawing. The Mega Ball is drawn from a separate pool of 1–25.",
  },
  {
    question: "What is the difference between Powerball and Mega Millions?",
    answer:
      "Both are multi-state lottery games with large jackpots, similar federal tax treatment, and lump sum/annuity options. Powerball draws Monday, Wednesday, and Saturday at 10:59 PM ET. Mega Millions draws Tuesday and Friday at 11:00 PM ET. Mega Millions historically reaches larger jackpots more frequently. The tax math is identical — your state is the biggest variable.",
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
  name: "Mega Millions Payout Calculator",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description:
    "Calculate your real Mega Millions payout after federal and state taxes for all 50 states. Compare lump sum vs annuity take-home.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function MegaMillionsPage() {
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
      <MegaMillionsCalculator />

      {/* FAQ Section */}
      <div className="max-w-2xl mx-auto px-4 pb-14">
        <h2 className="text-xl font-extrabold text-gray-900 mb-6">
          Mega Millions Payout — Common Questions
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
