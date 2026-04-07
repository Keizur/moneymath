"use client";

import { useState, useMemo } from "react";
import { calculateLoan, maxLoanFromPayment } from "@/lib/loanCalculations";
import { formatCurrency } from "@/lib/calculations";

function parseDollar(raw: string) {
  return parseFloat(raw.replace(/[^0-9.]/g, "")) || 0;
}
function fmtDollar(n: number) {
  return n ? n.toLocaleString("en-US") : "";
}

const TERMS = [24, 36, 48, 60, 72, 84];

export default function CarLoanCalculator() {
  const [affordOpen, setAffordOpen] = useState(false);
  const [incomeRaw, setIncomeRaw] = useState("");

  const [priceRaw, setPriceRaw] = useState("35,000");
  const [downRaw, setDownRaw] = useState("5,000");
  const [tradeRaw, setTradeRaw] = useState("");
  const [term, setTerm] = useState(60);
  const [rate, setRate] = useState("6.5");

  const monthlyIncome = parseDollar(incomeRaw);
  const maxCarPayment15 = monthlyIncome * 0.15; // 15% rule
  const maxCarPayment10 = monthlyIncome * 0.10; // conservative 10%
  const maxLoan15 = maxLoanFromPayment(maxCarPayment15, parseFloat(rate) || 0, term);
  const maxCarPrice15 = maxLoan15 + parseDollar(downRaw) + parseDollar(tradeRaw);

  const vehiclePrice = parseDollar(priceRaw);
  const downPayment = parseDollar(downRaw);
  const tradeIn = parseDollar(tradeRaw);
  const annualRate = parseFloat(rate) || 0;

  const principal = Math.max(0, vehiclePrice - downPayment - tradeIn);

  const result = useMemo(
    () => calculateLoan(principal, annualRate, term),
    [principal, annualRate, term]
  );

  const totalOutOfPocket = downPayment + result.totalPaid;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
          Car Loan Calculator
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
          What Will Your Car Cost You?
        </h1>
        <p className="text-gray-500 text-lg">
          Monthly payment, total interest, and the full picture on your auto loan.
        </p>
      </div>

      {/* Affordability Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
        <button
          onClick={() => setAffordOpen(!affordOpen)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">🚗</span>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-900">How Much Can I Afford?</p>
              <p className="text-xs text-gray-400">Based on your monthly take-home pay</p>
            </div>
          </div>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${affordOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {affordOpen && (
          <div className="px-6 pb-6 border-t border-gray-100">
            <div className="mt-4 mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Monthly Take-Home Pay</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="5,000"
                  value={incomeRaw}
                  onChange={(e) => setIncomeRaw(fmtDollar(parseDollar(e.target.value)))}
                  className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                />
              </div>
            </div>

            {monthlyIncome > 0 && (
              <div className="bg-purple-50 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-purple-600 opacity-70">Conservative (10%)</p>
                    <p className="text-lg font-extrabold text-purple-700">{formatCurrency(maxCarPayment10)}/mo</p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-600 opacity-70">Max recommended (15%)</p>
                    <p className="text-lg font-extrabold text-purple-700">{formatCurrency(maxCarPayment15)}/mo</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg px-3 py-2 mb-3 text-sm">
                  <span className="text-gray-500">Max vehicle price at 15%: </span>
                  <span className="font-bold text-gray-900">{formatCurrency(Math.round(maxCarPrice15 / 500) * 500)}</span>
                  <span className="text-gray-400 text-xs ml-1">({term}mo at {rate}%)</span>
                </div>
                <button
                  onClick={() => {
                    const rounded = Math.round(maxCarPrice15 / 500) * 500;
                    setPriceRaw(fmtDollar(rounded));
                    setAffordOpen(false);
                  }}
                  className="w-full py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Use this vehicle price →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        {/* Vehicle Price */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Price</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
            <input
              type="text"
              inputMode="numeric"
              value={priceRaw}
              onChange={(e) => setPriceRaw(fmtDollar(parseDollar(e.target.value)))}
              className="w-full pl-8 pr-4 py-3.5 border border-gray-200 rounded-xl text-base font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            />
          </div>
        </div>

        {/* Down + Trade-in */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Down Payment</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={downRaw}
                onChange={(e) => setDownRaw(fmtDollar(parseDollar(e.target.value)))}
                className="w-full pl-8 pr-4 py-3.5 border border-gray-200 rounded-xl text-base font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Trade-in Value</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={tradeRaw}
                onChange={(e) => setTradeRaw(fmtDollar(parseDollar(e.target.value)))}
                className="w-full pl-8 pr-4 py-3.5 border border-gray-200 rounded-xl text-base font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              />
            </div>
          </div>
        </div>

        {/* Loan Term */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Loan Term</label>
          <div className="grid grid-cols-6 gap-1.5">
            {TERMS.map((t) => (
              <button
                key={t}
                onClick={() => setTerm(t)}
                className={`py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                  term === t
                    ? "bg-purple-600 text-white border-purple-600"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {t}mo
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
              className="w-full px-4 pr-10 py-3.5 border border-gray-200 rounded-xl text-base font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">%</span>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">New cars typically 5–8% · Used cars typically 7–13% depending on credit score.</p>
        </div>

        <div className="border-t border-gray-100 mb-6"></div>

        {/* Financed amount summary */}
        {principal > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6 flex justify-between items-center text-sm">
            <span className="text-gray-500">Amount Financed</span>
            <span className="font-bold text-gray-900">{formatCurrency(principal)}</span>
          </div>
        )}

        {/* Monthly Payment Hero */}
        <div className="bg-purple-50 rounded-2xl p-6 text-center mb-6">
          <p className="text-sm font-semibold text-purple-700 mb-1 uppercase tracking-wide">Monthly Payment</p>
          <p className="text-5xl font-extrabold text-purple-600 mb-1">
            {formatCurrency(result.monthlyPayment)}
          </p>
          <p className="text-purple-600 text-xs mt-1 opacity-60">
            {term} payments over {(term / 12).toFixed(term % 12 === 0 ? 0 : 1)} {term % 12 === 0 ? "years" : "years"}
          </p>
        </div>

        {/* Breakdown */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Loan Amount</span>
            <span className="font-semibold text-gray-900">{formatCurrency(principal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Total Interest</span>
            <span className="font-semibold text-red-500">+{formatCurrency(result.totalInterest)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Total Loan Cost</span>
            <span className="font-semibold text-gray-900">{formatCurrency(result.totalPaid)}</span>
          </div>
          {(downPayment > 0 || tradeIn > 0) && (
            <div className="flex justify-between items-center border-t border-gray-100 pt-3">
              <span className="text-gray-600 text-sm font-semibold">Total Out-of-Pocket</span>
              <span className="font-bold text-gray-900">{formatCurrency(totalOutOfPocket)}</span>
            </div>
          )}
        </div>

        {/* Principal vs Interest bar */}
        <div className="mb-2">
          <div className="flex rounded-full overflow-hidden h-3 bg-gray-100">
            <div className="bg-purple-500 transition-all duration-500" style={{ width: `${(result.principalPercent * 100).toFixed(1)}%` }} />
            <div className="bg-red-400 transition-all duration-500" style={{ width: `${(result.interestPercent * 100).toFixed(1)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1.5">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>Principal ({(result.principalPercent * 100).toFixed(0)}%)</span>
            <span className="flex items-center gap-1">Interest ({(result.interestPercent * 100).toFixed(0)}%) <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span></span>
          </div>
        </div>
      </div>

      {/* Affiliate CTA — swap href for your LendingTree auto affiliate link */}
      <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-bold text-gray-900 mb-1">Find a better auto loan rate</p>
            <p className="text-sm text-gray-500">Get pre-qualified offers from multiple lenders — no hard credit pull required.</p>
          </div>
          <a
            href="https://www.lendingtree.com/auto/"
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="shrink-0 bg-purple-600 text-white font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-purple-700 transition-colors whitespace-nowrap"
          >
            Check My Rate →
          </a>
        </div>
        <p className="text-xs text-gray-400 mt-3">Sponsored · LendingTree</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">Shorter Is Cheaper</p>
          <p className="text-sm text-gray-600">A 36-month loan costs significantly less in interest than 72 months, even at the same rate. The payment is higher but the total cost is lower.</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">Credit Score Matters</p>
          <p className="text-sm text-gray-600">A 750+ credit score can get you rates 3–5% lower than a 620 score — which can mean thousands saved on a typical car loan.</p>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 leading-relaxed">
        Estimates do not include taxes, registration fees, dealer fees, or gap insurance. Actual loan terms depend on your lender and credit profile.
      </p>
    </div>
  );
}
