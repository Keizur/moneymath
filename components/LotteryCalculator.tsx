"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
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

interface WinningNumbers {
  whiteBalls: number[];
  powerball: number;
  powerPlay: string | null;
  drawDate: string | null;
}

export default function LotteryCalculator() {
  const [jackpotData, setJackpotData] = useState<JackpotData | null>(null);
  const [winningNumbers, setWinningNumbers] = useState<WinningNumbers | null>(null);
  const [jackpot, setJackpot] = useState(500_000_000);
  const [cashValue, setCashValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState("");
  const [payoutType, setPayoutType] = useState<"lump" | "annuity">("lump");
  const [copied, setCopied] = useState(false);
  const [stateSearch, setStateSearch] = useState("");
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const stateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (stateRef.current && !stateRef.current.contains(e.target as Node)) {
        setStateDropdownOpen(false);
        setStateSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  useEffect(() => {
    fetch("/api/numbers")
      .then((r) => r.json())
      .then((data: WinningNumbers) => {
        if (data.whiteBalls?.length === 5 && data.powerball) {
          setWinningNumbers(data);
        }
      })
      .catch(() => {});
  }, []);

  const stateData = selectedState ? STATE_TAX_RATES[selectedState] : null;

  const result = stateData
    ? payoutType === "lump"
      ? calculateLumpSum(jackpot, stateData.rate, cashValue ?? undefined)
      : calculateAnnuity(jackpot, stateData.rate)
    : null;

  const sortedStates = Object.entries(STATE_TAX_RATES).sort((a, b) =>
    a[1].name.localeCompare(b[1].name)
  );

  function shareResults() {
    if (!result || !stateData) return;
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
    if (!result || !stateData) return;
    const takeHome = formatCurrency(result.takeHome);
    const jackpotLabel = jackpotData?.jackpotRaw ?? formatMillions(jackpot);
    const text = `Powerball ${jackpotLabel} jackpot → ${takeHome} take-home in ${stateData.name} — moneymath.com`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* I Won link */}
      <div className="flex justify-end mb-2">
        <Link
          href="/i-won"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition-colors"
        >
          I Won — Now What?
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

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
        <div className="mb-8" ref={stateRef}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Your State
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Select your state..."
              value={stateDropdownOpen ? stateSearch : (stateData?.name ?? "")}
              onFocus={() => { setStateDropdownOpen(true); setStateSearch(""); }}
              onChange={(e) => setStateSearch(e.target.value)}
              readOnly={!stateDropdownOpen}
              className={`w-full px-4 py-3.5 pr-20 border rounded-xl text-sm font-medium focus:outline-none bg-white cursor-pointer transition-colors ${
                stateDropdownOpen
                  ? "border-green-500 ring-2 ring-green-500"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            />
            {stateData && !stateDropdownOpen && (
              <span className="absolute right-9 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                {stateData.rate === 0 ? "No Tax" : `${(stateData.rate * 100).toFixed(2)}%`}
              </span>
            )}
            <svg
              className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform duration-150 ${stateDropdownOpen ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {stateDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {sortedStates
                  .filter(([, data]) =>
                    data.name.toLowerCase().includes(stateSearch.toLowerCase())
                  )
                  .map(([code, data]) => (
                    <button
                      key={code}
                      onMouseDown={() => {
                        setSelectedState(code);
                        setStateDropdownOpen(false);
                        setStateSearch("");
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-green-50 flex justify-between items-center ${
                        selectedState === code ? "bg-green-50 font-semibold text-green-700" : "text-gray-700"
                      }`}
                    >
                      <span>{data.name}</span>
                      <span className="text-gray-400 text-xs">
                        {data.rate === 0 ? "No Tax" : `${(data.rate * 100).toFixed(2)}%`}
                      </span>
                    </button>
                  ))}
              </div>
            )}
          </div>
          {stateData?.note && (
            <p className="text-xs text-green-600 mt-1.5 font-medium">
              ✓ {stateData.note}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 mb-6"></div>

        {!result ? (
          <div className="bg-gray-50 rounded-2xl p-8 text-center mb-6">
            <p className="text-gray-400 text-sm font-medium">Select your state above to see your take-home</p>
          </div>
        ) : (
          <>
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
                  {stateData!.name} State Tax (
                  {stateData!.rate === 0 ? "0%" : `${(stateData!.rate * 100).toFixed(2)}%`})
                </span>
                <span className={`font-semibold ${stateData!.rate > 0 ? "text-red-500" : "text-green-500"}`}>
                  {stateData!.rate === 0 ? "—" : `-${formatCurrency(result.stateTax)}`}
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
          </>
        )}

        {/* Share Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={shareResults}
            disabled={!result}
            className={`flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl text-sm font-semibold transition-colors ${
              result ? "hover:bg-gray-800" : "opacity-40 cursor-not-allowed"
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.738l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
            </svg>
            Post on X
          </button>
          <button
            onClick={copyResults}
            disabled={!result}
            className={`flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-xl text-sm font-semibold transition-colors ${
              result ? "hover:bg-gray-200" : "opacity-40 cursor-not-allowed"
            }`}
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

      {/* Winning Numbers */}
      {winningNumbers && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Last Winning Numbers</h2>
              {winningNumbers.drawDate && (
                <p className="text-xs text-gray-400 mt-0.5">{winningNumbers.drawDate}</p>
              )}
            </div>
            {winningNumbers.powerPlay && (
              <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1.5 rounded-full">
                Power Play {winningNumbers.powerPlay}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {winningNumbers.whiteBalls.map((n, i) => (
              <div
                key={i}
                className="w-11 h-11 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center text-sm font-extrabold text-gray-800"
              >
                {n}
              </div>
            ))}
            <div className="w-3 h-0.5 bg-gray-300 mx-1"></div>
            <div className="w-11 h-11 rounded-full bg-red-500 border-2 border-red-600 flex items-center justify-center text-sm font-extrabold text-white">
              {winningNumbers.powerball}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">White balls · <span className="text-red-400">Red = Powerball</span></p>
        </div>
      )}

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
