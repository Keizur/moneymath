"use client";

import { useState, useMemo } from "react";
import { calculateLoan } from "@/lib/loanCalculations";
import { formatCurrency } from "@/lib/calculations";

function parseDollar(raw: string) {
  return parseFloat(raw.replace(/[^0-9.]/g, "")) || 0;
}
function fmtDollar(n: number) {
  return n ? n.toLocaleString("en-US") : "";
}

export default function MortgageCalculator() {
  const [priceRaw, setPriceRaw] = useState("400,000");
  const [downRaw, setDownRaw] = useState("80,000");
  const [downMode, setDownMode] = useState<"$" | "%">("$");
  const [downPct, setDownPct] = useState("20");
  const [term, setTerm] = useState<15 | 30>(30);
  const [rate, setRate] = useState("6.9");
  const [showAmort, setShowAmort] = useState(false);

  const homePrice = parseDollar(priceRaw);
  const annualRate = parseFloat(rate) || 0;

  const downPayment = downMode === "$"
    ? parseDollar(downRaw)
    : homePrice * (parseFloat(downPct) || 0) / 100;

  const principal = Math.max(0, homePrice - downPayment);
  const downPctDisplay = homePrice > 0 ? ((downPayment / homePrice) * 100).toFixed(1) : "0";

  const result = useMemo(
    () => calculateLoan(principal, annualRate, term * 12),
    [principal, annualRate, term]
  );

  // Compare 15yr vs 30yr
  const alt = useMemo(
    () => calculateLoan(principal, annualRate, (term === 30 ? 15 : 30) * 12),
    [principal, annualRate, term]
  );

  const savings = Math.abs(result.totalInterest - alt.totalInterest);
  const altLabel = term === 30 ? "15-year" : "30-year";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
          Mortgage Calculator
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
          What's Your Monthly Payment?
        </h1>
        <p className="text-gray-500 text-lg">
          See your true mortgage cost — principal, interest, and total paid over time.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        {/* Home Price */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Home Price</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
            <input
              type="text"
              inputMode="numeric"
              value={priceRaw}
              onChange={(e) => {
                const v = parseDollar(e.target.value);
                setPriceRaw(fmtDollar(v));
                if (downMode === "%") {/* recalc happens via derived state */}
              }}
              className="w-full pl-8 pr-4 py-3.5 border border-gray-200 rounded-xl text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
        </div>

        {/* Down Payment */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-gray-700">
              Down Payment
              {homePrice > 0 && <span className="ml-2 text-gray-400 font-normal">({downPctDisplay}%)</span>}
            </label>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setDownMode("$")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${downMode === "$" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"}`}
              >$</button>
              <button
                onClick={() => setDownMode("%")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${downMode === "%" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"}`}
              >%</button>
            </div>
          </div>
          {downMode === "$" ? (
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={downRaw}
                onChange={(e) => setDownRaw(fmtDollar(parseDollar(e.target.value)))}
                className="w-full pl-8 pr-4 py-3.5 border border-gray-200 rounded-xl text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>
          ) : (
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={downPct}
                onChange={(e) => setDownPct(e.target.value)}
                className="w-full px-4 pr-8 py-3.5 border border-gray-200 rounded-xl text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">%</span>
            </div>
          )}
          {parseFloat(downPctDisplay) < 20 && homePrice > 0 && (
            <p className="text-xs text-amber-600 mt-1.5 font-medium">⚠ Under 20% down typically requires PMI (~0.5–1% of loan/yr)</p>
          )}
        </div>

        {/* Term */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Loan Term</label>
          <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl">
            {([30, 15] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTerm(t)}
                className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  term === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t}-Year Fixed
              </button>
            ))}
          </div>
        </div>

        {/* Rate */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Interest Rate</label>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={30}
              step={0.1}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full px-4 pr-10 py-3.5 border border-gray-200 rounded-xl text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">%</span>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">Check Bankrate or your lender for today's current rates.</p>
        </div>

        <div className="border-t border-gray-100 mb-6"></div>

        {/* Monthly Payment Hero */}
        <div className="bg-blue-50 rounded-2xl p-6 text-center mb-6">
          <p className="text-sm font-semibold text-blue-700 mb-1 uppercase tracking-wide">Monthly Payment</p>
          <p className="text-5xl font-extrabold text-blue-600 mb-1">
            {formatCurrency(result.monthlyPayment)}
          </p>
          <p className="text-blue-600 text-xs mt-1 opacity-60">Principal & interest only · does not include taxes/insurance</p>
        </div>

        {/* Breakdown */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Loan Amount</span>
            <span className="font-semibold text-gray-900">{formatCurrency(principal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Total Interest Paid</span>
            <span className="font-semibold text-red-500">+{formatCurrency(result.totalInterest)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Total Cost of Loan</span>
            <span className="font-semibold text-gray-900">{formatCurrency(result.totalPaid)}</span>
          </div>
        </div>

        {/* Principal vs Interest bar */}
        <div className="mb-6">
          <div className="flex rounded-full overflow-hidden h-3 bg-gray-100">
            <div className="bg-blue-500 transition-all duration-500" style={{ width: `${(result.principalPercent * 100).toFixed(1)}%` }} />
            <div className="bg-red-400 transition-all duration-500" style={{ width: `${(result.interestPercent * 100).toFixed(1)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1.5">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>Principal ({(result.principalPercent * 100).toFixed(0)}%)</span>
            <span className="flex items-center gap-1">Interest ({(result.interestPercent * 100).toFixed(0)}%) <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span></span>
          </div>
        </div>

        {/* 15 vs 30 comparison */}
        {principal > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-gray-500 mb-2">
              vs. {altLabel} mortgage
            </p>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Monthly payment</p>
                <p className="font-bold text-gray-900">{formatCurrency(alt.monthlyPayment)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Interest savings</p>
                <p className={`font-bold ${term === 15 ? "text-red-500" : "text-green-600"}`}>
                  {term === 30 ? "Save " : "Cost "}{formatCurrency(savings)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Amortization toggle */}
        {result.amortization.length > 0 && (
          <div>
            <button
              onClick={() => setShowAmort(!showAmort)}
              className="w-full flex items-center justify-between text-sm font-semibold text-gray-600 hover:text-gray-800 py-2"
            >
              <span>Year-by-Year Breakdown</span>
              <svg className={`w-4 h-4 transition-transform ${showAmort ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showAmort && (
              <div className="mt-2 rounded-xl border border-gray-100 overflow-hidden text-xs">
                <div className="grid grid-cols-4 bg-gray-50 px-3 py-2 text-gray-400 font-semibold uppercase tracking-wide text-xs">
                  <span>Year</span>
                  <span className="text-right">Principal</span>
                  <span className="text-right">Interest</span>
                  <span className="text-right">Balance</span>
                </div>
                {result.amortization
                  .filter((_, i) => i % (term === 30 ? 5 : 1) === 0 || _ === result.amortization[result.amortization.length - 1])
                  .map((row) => (
                    <div key={row.year} className="grid grid-cols-4 px-3 py-2 border-t border-gray-100 hover:bg-gray-50">
                      <span className="text-gray-600">Yr {row.year}</span>
                      <span className="text-right text-blue-600">{formatCurrency(row.principalPaid)}</span>
                      <span className="text-right text-red-400">{formatCurrency(row.interestPaid)}</span>
                      <span className="text-right text-gray-900 font-medium">{formatCurrency(row.remainingBalance)}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">20% Down Rule</p>
          <p className="text-sm text-gray-600">Putting down 20% avoids PMI — private mortgage insurance that adds 0.5–1% of the loan amount per year to your payment.</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">15 vs 30 Year</p>
          <p className="text-sm text-gray-600">A 15-year mortgage has higher monthly payments but typically saves hundreds of thousands in interest over the life of the loan.</p>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 leading-relaxed">
        Estimates are for principal and interest only. Actual payments may include property tax, homeowner's insurance, and PMI. Consult a mortgage lender for exact figures.
      </p>
    </div>
  );
}
