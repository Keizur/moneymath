import { NextResponse } from "next/server";

export const revalidate = 3600;

function parseDollarAmount(str: string): number | null {
  const clean = str.trim().replace(/,/g, "");
  const match = clean.match(/\$?([\d.]+)\s*(Million|Billion|Trillion)?/i);
  if (!match) return null;
  const num = parseFloat(match[1]);
  const suffix = match[2]?.toLowerCase();
  if (suffix === "billion") return Math.round(num * 1_000_000_000);
  if (suffix === "million") return Math.round(num * 1_000_000);
  if (suffix === "trillion") return Math.round(num * 1_000_000_000_000);
  return Math.round(num);
}

function parseDrawDateUTC(labelText: string): string | null {
  // "Today at 11:00 pm EDT" → today's date
  if (/today/i.test(labelText)) {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, "0");
    const d = String(now.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}T03:00:00.000Z`; // 11pm ET ≈ 3am UTC next day, use today for label matching
  }
  // "Tuesday, Apr 8, 2026 at 11:00 pm EDT"
  const match = labelText.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d+),?\s+(\d{4})/i);
  if (match) {
    try {
      return new Date(`${match[0]} 23:00:00 GMT-0400`).toISOString();
    } catch {
      return null;
    }
  }
  return null;
}

export async function GET() {
  try {
    const res = await fetch("https://www.lotteryusa.com/mega-millions/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error(`lotteryusa.com responded ${res.status}`);

    const html = await res.text();

    // Jackpot: "$100 Million Cash value:"
    const jackpotMatch = html.match(
      /\$([\d,]+(?:\.\d+)?)\s*(Million|Billion)\s+Cash\s+value/i
    );
    const jackpotRaw = jackpotMatch
      ? `$${jackpotMatch[1].replace(/,/g, "")} ${jackpotMatch[2]}`
      : null;
    const jackpot = jackpotRaw ? parseDollarAmount(jackpotRaw) : null;

    // Cash value: "Cash value: $45.3 Million"
    const cashMatch = html.match(
      /Cash\s+value:\s*\$([\d,]+(?:\.\d+)?)\s*(Million|Billion)/i
    );
    const cashRaw = cashMatch
      ? `$${cashMatch[1].replace(/,/g, "")} ${cashMatch[2]}`
      : null;
    const cashValue = cashRaw ? parseDollarAmount(cashRaw) : null;

    // Draw label: "Next Mega Millions draw ... Today at 11:00 pm EDT"
    const drawLabelMatch = html.match(
      /Next\s+Mega\s+Millions\s+draw[\s\S]{0,100}?((?:Today|Tomorrow|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)[^\n<"]+)/i
    );
    const rawLabel = drawLabelMatch?.[1]?.trim() ?? null;
    const nextDrawingLabel = rawLabel ?? null;
    const drawDateUTC = rawLabel ? parseDrawDateUTC(rawLabel) : null;

    if (!jackpot) {
      return NextResponse.json(
        { error: "Could not parse Mega Millions jackpot" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      jackpot,
      cashValue,
      cashValueRaw: cashRaw,
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
