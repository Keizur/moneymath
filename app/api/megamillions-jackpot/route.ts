import { NextResponse } from "next/server";

export const revalidate = 3600;

function parseDollarAmount(str: string): number | null {
  const clean = str.trim().replace(/,/g, "");
  const match = clean.match(/\$?([\d.]+)\s*(M(?:illion)?|B(?:illion)?|T(?:rillion)?)?/i);
  if (!match) return null;
  const num = parseFloat(match[1]);
  const suffix = match[2]?.toLowerCase();
  if (!suffix) return Math.round(num);
  if (suffix.startsWith("b")) return Math.round(num * 1_000_000_000);
  if (suffix.startsWith("m")) return Math.round(num * 1_000_000);
  if (suffix.startsWith("t")) return Math.round(num * 1_000_000_000_000);
  return Math.round(num);
}

function formatRaw(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(amount % 1_000_000_000 === 0 ? 0 : 1)} Billion`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)} Million`;
  return `$${amount.toLocaleString()}`;
}

function parseDrawDateUTC(dateStr: string): string | null {
  // "Tue, Apr 7, 2026" or "Apr 7, 2026"
  const match = dateStr.match(
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d+),?\s+(\d{4})/i
  );
  if (!match) return null;
  try {
    return new Date(`${match[1]} ${match[2]}, ${match[3]} 23:00:00 GMT-0400`).toISOString();
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const res = await fetch("https://www.lotterypost.com/jackpots", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error(`lotterypost.com responded ${res.status}`);

    const html = await res.text();
    const htmlSnippet = html.slice(0, 500); // debug

    // Find the Mega Millions row in jackpotsTable
    const mmRowMatch = html.match(
      /<tr[^>]*>(?:(?!<\/tr>)[\s\S])*?Mega\s+Millions(?:(?!<\/tr>)[\s\S])*?<\/tr>/i
    );

    if (!mmRowMatch) {
      return NextResponse.json(
        { error: "Could not find Mega Millions row", htmlSnippet, htmlLength: html.length },
        { status: 502 }
      );
    }

    const row = mmRowMatch[0];

    // Jackpot: first $XX Million/Billion in the row
    const jackpotMatch = row.match(
      /\$([\d,]+(?:\.\d+)?)\s*(Million|Billion|M\b|B\b)/i
    );
    if (!jackpotMatch) {
      return NextResponse.json(
        { error: "Could not parse jackpot amount" },
        { status: 502 }
      );
    }

    const jackpot = parseDollarAmount(`${jackpotMatch[1]} ${jackpotMatch[2]}`);
    if (!jackpot) {
      return NextResponse.json(
        { error: "Could not parse jackpot number" },
        { status: 502 }
      );
    }

    const jackpotRaw = formatRaw(jackpot);

    // Cash value: ~60% of jackpot (lotterypost doesn't show it)
    const cashValue = Math.round(jackpot * 0.6);
    const cashValueRaw = formatRaw(cashValue);

    // Draw date: "Tue, Apr 7, 2026" pattern in the row
    const drawDateMatch = row.match(
      /(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d+),?\s+(\d{4})/i
    );
    const drawDateStr = drawDateMatch?.[0] ?? null;
    const nextDrawingLabel = drawDateStr ?? null;
    const drawDateUTC = drawDateStr ? parseDrawDateUTC(drawDateStr) : null;

    return NextResponse.json({
      jackpot,
      cashValue,
      cashValueRaw,
      jackpotRaw,
      nextDrawingLabel,
      drawDateUTC,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Mega Millions jackpot fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch jackpot" }, { status: 502 });
  }
}
