"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/powerball", label: "POWERBALL", powerball: true },
  { href: "/investment", label: "Investment" },
  { href: "/mortgage", label: "Mortgage" },
  { href: "/car-loan", label: "Car Loan" },
  { href: "/salary", label: "Salary" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-extrabold text-gray-900 text-lg tracking-tight">
          MoneyMath
        </Link>
        <div className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                link.powerball
                  ? pathname === link.href
                    ? "bg-red-50 text-red-600 font-extrabold tracking-wide"
                    : "text-red-500 font-extrabold tracking-wide hover:bg-red-50 hover:text-red-600"
                  : pathname === link.href
                  ? "bg-green-50 text-green-700 font-medium"
                  : "text-gray-500 font-medium hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
