"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/powerball", label: "POWERBALL", powerball: true },
  { href: "/megamillions", label: "MEGA MILLIONS", megamillions: true },
  { href: "/investment", label: "Investment" },
  { href: "/mortgage", label: "Mortgage" },
  { href: "/car-loan", label: "Car Loan" },
  { href: "/salary", label: "Salary" },
];

function LinkItem({ link, pathname }: { link: typeof links[0]; pathname: string }) {
  const isActive = pathname === link.href;
  let className = "shrink-0 px-3 py-1.5 rounded-lg text-sm transition-colors ";
  if (link.powerball) {
    className += isActive
      ? "bg-red-50 text-red-600 font-extrabold tracking-wide"
      : "text-red-500 font-extrabold tracking-wide hover:bg-red-50 hover:text-red-600";
  } else if (link.megamillions) {
    className += isActive
      ? "bg-yellow-50 text-yellow-600 font-extrabold tracking-wide"
      : "text-yellow-500 font-extrabold tracking-wide hover:bg-yellow-50 hover:text-yellow-600";
  } else {
    className += isActive
      ? "bg-green-50 text-green-700 font-medium"
      : "text-gray-500 font-medium hover:text-gray-800 hover:bg-gray-50";
  }
  return (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  );
}

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-2xl mx-auto">
        {/* Logo row — on desktop, links sit inline here */}
        <div className="px-4 pt-3 sm:pb-3 pb-2 flex items-center justify-between">
          <Link href="/" className="font-extrabold text-gray-900 text-lg tracking-tight shrink-0">
            MoneyMath
          </Link>
          {/* Desktop links */}
          <div className="hidden sm:flex items-center gap-1">
            {links.map((link) => (
              <LinkItem key={link.href} link={link} pathname={pathname} />
            ))}
          </div>
        </div>
        {/* Mobile: scrollable links row — overflow-hidden on nav clips this to viewport */}
        <div className="nav-links sm:hidden flex overflow-x-auto px-4 pb-2.5 gap-1" style={{ scrollbarWidth: "none" }}>
          {links.map((link) => (
            <LinkItem key={link.href} link={link} pathname={pathname} />
          ))}
        </div>
      </div>
    </nav>
  );
}
