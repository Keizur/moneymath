import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "I Won the Powerball — What Do I Do Now? | MoneyMath",
  description:
    "A step-by-step guide for lottery winners. Before you claim your ticket, read this. From signing your ticket to building your financial team — what to do and what not to do.",
  keywords:
    "won powerball what to do, lottery winner guide, won lottery next steps, lottery winner advice, how to claim powerball, powerball winner trust",
  openGraph: {
    title: "I Won the Powerball — What Do I Do Now? | MoneyMath",
    description: "Step-by-step guide for lottery winners. Read before you claim.",
    type: "article",
  },
};

const steps = [
  {
    number: "01",
    title: "Stop. Tell no one.",
    color: "red",
    body: "This is the hardest step and the most important. Do not tell your family, friends, or partner until you have a legal and financial plan in place. Lottery winners who go public immediately face a surge of requests, scams, and relationships that permanently change. Give yourself at least a few weeks of silence.",
  },
  {
    number: "02",
    title: "Sign the back of your ticket immediately.",
    color: "red",
    body: "A lottery ticket is a bearer instrument — whoever holds it can claim it. Signing the back establishes ownership. Do it in pen, right now. Then make a photocopy or take a photo of both sides and store the original somewhere safe, like a fireproof safe or a safety deposit box.",
  },
  {
    number: "03",
    title: "Hire a lottery attorney before you claim.",
    color: "amber",
    body: "This is not optional. A lottery attorney specializes in protecting winners. They can set up a trust or LLC to claim the prize anonymously (in states that allow it), shield your identity from the public, and structure the claim to minimize tax exposure. Expect to pay $500–$2,000 for this — it is worth every dollar on a multi-million dollar win.",
  },
  {
    number: "04",
    title: "Claim through a trust or LLC, not your name.",
    color: "amber",
    body: "Many states allow winners to claim through a legal entity. This means \"Smith Family Trust\" or \"Lucky Day LLC\" is listed publicly instead of your name. Even in states that require public disclosure, an attorney can often delay or minimize exposure. Check your state's anonymity laws — Florida, Georgia, and New Jersey require disclosure; Delaware, Kansas, Maryland, and others allow anonymity.",
  },
  {
    number: "05",
    title: "Hire a fee-only fiduciary financial advisor.",
    color: "blue",
    body: "Not a wealth manager who earns commissions. Not your uncle who works in finance. A fiduciary is legally required to act in your interest. Fee-only means they charge a flat rate or hourly fee — not a percentage of assets or product commissions. Find one through NAPFA.org (National Association of Personal Financial Advisors). Interview at least three before choosing.",
  },
  {
    number: "06",
    title: "Hire a CPA with lottery experience.",
    color: "blue",
    body: "Federal tax on lottery winnings is 37%. Your state may take another 0–13%. But a good CPA can identify charitable giving strategies, timing strategies, and entity structures that reduce your total tax burden significantly. The IRS will automatically withhold 24% at payout — you will owe the remaining balance at tax time, and you need to be prepared for that.",
  },
  {
    number: "07",
    title: "Lump sum or annuity? Run the numbers.",
    color: "green",
    body: "The annuity pays the advertised jackpot over 30 years. The lump sum is roughly 60% of that, paid immediately — then taxed. Most financial advisors recommend the lump sum for winners who are disciplined investors, because invested money compounds faster than the annuity schedule. Use our calculator below to see your real take-home under each option.",
    cta: { label: "Calculate your take-home", href: "/" },
  },
  {
    number: "08",
    title: "Don't quit your job yet.",
    color: "gray",
    body: "Wait until everything is legally settled and the funds hit your account before making life changes. The claim process can take weeks. Quitting your job the day after buying a winning ticket (before claiming it) is a fast way to telegraph what happened. Keep your routine and give yourself time to process the change with a clear head.",
  },
  {
    number: "09",
    title: "Set a clear plan for family and friends.",
    color: "gray",
    body: "Decide before you tell anyone how you will handle requests for money. Having a simple policy — \"I'm not making any financial decisions for 6 months\" — protects your relationships and your sanity. Many winners say the hardest part wasn't the money, it was the way it changed the people around them. Having a policy in place before those conversations happen is essential.",
  },
  {
    number: "10",
    title: "Think about where you live.",
    color: "gray",
    body: "If you live in a high-tax state, winning a massive jackpot might be the right time to evaluate a move. States like Florida, Texas, Washington, and Nevada have no state income tax. On a $100M lump sum win, moving from California (13.3%) to Florida (0%) saves over $13 million. Your attorney and CPA can advise on the timing of any residency change relative to claiming.",
    cta: { label: "See state tax rates", href: "/" },
  },
];

const colorMap: Record<string, string> = {
  red: "bg-red-100 text-red-700",
  amber: "bg-amber-100 text-amber-700",
  blue: "bg-blue-100 text-blue-700",
  green: "bg-green-100 text-green-700",
  gray: "bg-gray-100 text-gray-600",
};

export default function IWonPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
          Powerball Winner Guide
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
          I Won the Powerball.<br />Now What?
        </h1>
        <p className="text-gray-500 text-lg">
          Read this before you do anything. The decisions you make in the first 72 hours matter more than you think.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-4 mb-10">
        {steps.map((step) => (
          <div key={step.number} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start gap-4">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0 mt-0.5 ${colorMap[step.color]}`}>
                {step.number}
              </span>
              <div className="flex-1">
                <h2 className="text-base font-bold text-gray-900 mb-2">{step.title}</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{step.body}</p>
                {step.cta && (
                  <Link
                    href={step.cta.href}
                    className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-green-700 hover:text-green-800"
                  >
                    {step.cta.label}
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA Card */}
      <div className="bg-green-50 rounded-2xl p-6 text-center mb-6 border border-green-100">
        <h3 className="font-bold text-gray-900 mb-1">Know your real take-home first.</h3>
        <p className="text-sm text-gray-500 mb-4">
          Before you plan, run the numbers. Federal + state taxes will take a significant cut.
        </p>
        <Link
          href="/"
          className="inline-block bg-green-600 text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-green-700 transition-colors"
        >
          Calculate My Take-Home →
        </Link>
      </div>

      <p className="text-center text-xs text-gray-400 leading-relaxed">
        This guide is for informational purposes only. Consult a licensed attorney, CPA, and financial advisor before making any decisions.
      </p>
    </div>
  );
}
