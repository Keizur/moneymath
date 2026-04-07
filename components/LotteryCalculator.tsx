"use client";

import { useState, useEffect } from "react";
import { STATE_TAX_RATES } from "@/lib/taxRates";
import { calculateLumpSum, calculateAnnuity, formatCurrency, formatMillions } from "@/lib/calculations";

interface JackpotData {
  jackpot: number;
  cashValue: number | null;
  jackpotRaw: string;
  cashValueRaw: string | null;
  nextDrawingLabel: string | null;
  drawDateUTC: string | null;
  fetchedAt: string;
}

export default function LotteryCalculator() {
  const [jackpotData, setJackpotData] = useState<JackpotData | null>(null);
  const [jackpot, setJackpot] = useState(500_000_000);
  const [cashValue, setCashValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState("TX");
  const [payoutType, setPayoutType] = useState<"lump" | "annuity">("lump");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/jackpot")
      .then((r) => r.json())
      .then((data: JackpotData) => {
        if (data.jackpot) {
          setJackpotData(data);
          setJackpot(data.jackpot);
          if (data.cashValue) setCashValue(data.cashValue);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stateData = STATE_TAX_RATES[selectedState];

  // Use actual cash value from API if available, else fall back to 60%
  const effectiveCashValue = payoutType === "lump"
    ? (cashValue ?? jackpot * 0.6)
    : jackpot;

  const result = payoutType === "lump"
    ? calculateLumpSum(jackpot, stateData.rate, cashValue ?? undefined)
    : calculateAnnuity(jackpot, stateData.rate);

  const sortedStates = Object.entries(STATE_TAX_RATES).sort((a, b) =>
    a[1].name.localeCompare(b[1].name)
  );

  function shareResults() {
    const takeHome = formatMillions(result.takeHome);
    const jackpotLabel = jackpotData?.jackpotRaw ?? formatMillions(jackpot);
    const payoutLabel = payoutType === "lump" ? "lump sum" : "annuity";
    const text = `The current ${jackpotLabel} Powerball jackpot → ${takeHome} take-home after taxes in ${stateData.name} (${payoutLabel}). What's yours? moneymath.com`;

    if (navigator.share) {
      navigator.share({ text });
    } else {
      const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
      window.open(tweetUrl, "_blank");
    }
  }

  async function copyResults() {
    const takeHome = formatCurrency(result.takeHome);
    const jackpotLabel = jackpotData?.jackpotRaw ?? formatMillions(jackpot);
    const text = `Powerball ${jackpotLabel} jackpot → ${takeHome} take-home in ${stateData.name} — moneymath.com`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        {loading ? (
          <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-400 text-sm px-4 py-1.5 rounded-full mb-4 animate-pulse">
            Fetching tonight's jackpot...
          </div>
        ) : jackpotData ? (
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Next Drawing: {jackpotData.nextDrawingLabel ?? "Tonight"} · 10:59 PM ET
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
            Powerball · Enter jackpot below
          </div>
        )}
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
          What Would You Actually Take Home?
        </h1>
        <p className="text-gray-500 text-lg">
          Real Powerball payout after federal and state taxes — no fluff.
        </p>
        {jackpotData && (
          <p className="text-3xl font-extrabold text-gray-900 mt-4">
            Tonight's Jackpot:{" "}
            <span className="text-green-500">{jackpotData.jackpotRaw}</span>
          </p>
        )}
      </div>

      {/* Calculator Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        {/* Jackpot Display */}
        {jackpotData && (
          <div className="mb-6 bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between items-center text-sm">
              <div>
                <p className="text-gray-400 font-medium">Advertised Jackpot</p>
                <p className="text-xl font-extrabold text-gray-900">{jackpotData.jackpotRaw}</p>
              </div>
              {jackpotData.cashValueRaw && (
                <div className="text-right">
                  <p className="text-gray-400 font-medium">Cash Value</p>
                  <p className="text-xl font-extrabold text-gray-900">{jackpotData.cashValueRaw}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payout Type Toggle */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Payout Type
          </label>
          <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setPayoutType("lump")}
              className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${
                payoutType === "lump"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Lump Sum
            </button>
            <button
              onClick={() => setPayoutType("annuity")}
              className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${
                payoutType === "annuity"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Annuity (30 yrs)
            </button>
          </div>
        </div>

        {/* State Selector */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Your State
          </label>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-base font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
          >
            {sortedStates.map(([code, data]) => (
              <option key={code} value={code}>
                {data.name}{" "}
                {data.rate === 0 ? "(No State Tax)" : `(${(data.rate * 100).toFixed(2)}%)`}
              </option>
            ))}
          </select>
          {stateData.note && (
            <p className="text-xs text-green-600 mt-1.5 font-medium">
              ✓ {stateData.note}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 mb-6"></div>

        {/* Results Breakdown */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">
              {payoutType === "lump" ? "Advertised Jackpot" : "Total Annuity Value"}
            </span>
            <span className="font-semibold text-gray-900">{formatCurrency(result.jackpot)}</span>
          </div>

          {payoutType === "lump" && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">
                Cash Value (lump sum
                {jackpotData?.cashValueRaw
                  ? ` · ${jackpotData.cashValueRaw} per Powerball`
                  : " · ~60%"}
                )
              </span>
              <span className="font-semibold text-gray-900">{formatCurrency(result.cashValue)}</span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Federal Tax (37%)</span>
            <span className="font-semibold text-red-500">-{formatCurrency(result.federalTax)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">
              {stateData.name} State Tax (
              {stateData.rate === 0 ? "0%" : `${(stateData.rate * 100).toFixed(2)}%`})
            </span>
            <span className={`font-semibold ${stateData.rate > 0 ? "text-red-500" : "text-green-500"}`}>
              {stateData.rate === 0 ? "—" : `-${formatCurrency(result.stateTax)}`}
            </span>
          </div>
        </div>

        {/* Take Home Hero */}
        <div className="bg-green-50 rounded-2xl p-6 text-center mb-6">
          <p className="text-sm font-semibold text-green-700 mb-1 uppercase tracking-wide">
            {payoutType === "lump" ? "You Take Home" : "Total After-Tax (30 yrs)"}
          </p>
          <p className="text-5xl font-extrabold text-green-600 mb-1">
            {formatMillions(result.takeHome)}
          </p>
          <p className="text-green-700 text-sm opacity-75">{formatCurrency(result.takeHome)}</p>
          {payoutType === "annuity" && result.annualPayment && (
            <div className="mt-3 flex justify-center gap-6">
              <div>
                <p className="text-green-600 text-xs opacity-70">Per Year</p>
                <p className="text-green-700 text-sm font-bold">{formatCurrency(result.annualPayment)}</p>
              </div>
              <div className="border-l border-green-200"></div>
              <div>
                <p className="text-green-600 text-xs opacity-70">Per Month</p>
                <p className="text-green-700 text-sm font-bold">{formatCurrency(result.monthlyPayment!)}</p>
              </div>
            </div>
          )}
          <p className="text-green-600 text-xs mt-2 opacity-60">
            Effective tax rate: {(result.effectiveTaxRate * 100).toFixed(1)}%
          </p>
        </div>

        {/* Share Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={shareResults}
            className="flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.738l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
            </svg>
            Post on X
          </button>
          <button
            onClick={copyResults}
            className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Result
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">
            Lump Sum vs Annuity
          </p>
          <p className="text-sm text-gray-600">
            Lump sum pays cash upfront. Annuity pays the full amount over 30 years — more total, but you wait.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">
            Best States to Win In
          </p>
          <p className="text-sm text-gray-600">
            FL, TX, CA, WA, and NH have 0% state tax on lottery winnings — you keep significantly more.
          </p>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 leading-relaxed">
        Estimates based on current federal rate (37%) and state tax rates. Consult a financial advisor before making decisions.
      </p>
    </div>
  );
}
