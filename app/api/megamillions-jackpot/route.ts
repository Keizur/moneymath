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

export async function GET() {
  try {
    const res = await fetch("https://www.megamillions.com/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error("Failed to fetch megamillions.com");

    const html = await res.text();

    // Parse jackpot (advertised annuity value)
    const jackpotMatch = html.match(
      /game-jackpot-number text-xxxl[^>]*>\s*([^<]+)</
    );
    const jackpotRaw = jackpotMatch?.[1]?.trim() ?? null;
    const jackpot = jackpotRaw ? parseDollarAmount(jackpotRaw) : null;

    // Parse cash value
    const cashMatch = html.match(
      /game-jackpot-number text-lg[^>]*>\s*([^<]+)</
    );
    const cashRaw = cashMatch?.[1]?.trim() ?? null;
    const cashValue = cashRaw ? parseDollarAmount(cashRaw) : null;

    // Parse next drawing date
    const drawDateMatch = html.match(/data-drawdateutc="([^"]+)"/);
    const drawDateUTC = drawDateMatch?.[1] ?? null;

    // Parse next drawing label
    const nextDrawingSection = html.match(
      /id="next-drawing"[\s\S]*?title-date[^>]*>\s*([^<]+)</
    );
    const nextDrawingLabel = nextDrawingSection?.[1]?.trim() ?? null;

    if (!jackpot) {
      return NextResponse.json(
        { error: "Could not parse jackpot" },
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
