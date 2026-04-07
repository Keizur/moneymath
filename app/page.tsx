import LotteryCalculator from "@/components/LotteryCalculator";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-gray-900">
              Money<span className="text-green-500">Math</span>
            </span>
          </Link>
          <span className="text-xs text-gray-400 font-medium">
            Free Financial Calculators
          </span>
        </div>
      </nav>

      {/* Calculator */}
      <main>
        <LotteryCalculator />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white mt-8 py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm font-bold text-gray-900 mb-1">
            Money<span className="text-green-500">Math</span>
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Plain English financial calculators for everyone.
          </p>
          <div className="flex justify-center gap-6 text-xs text-gray-400">
            <span>Lottery Calculator</span>
            <span className="text-gray-200">|</span>
            <span className="text-gray-300">Mortgage Calculator — Coming Soon</span>
            <span className="text-gray-200">|</span>
            <span className="text-gray-300">Car Loan Calculator — Coming Soon</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
