import { NextResponse } from "next/server";

export const revalidate = 3600;

export async function GET() {
  try {
    const res = await fetch(
      "https://www.powerball.com/v1/gameapi/numbers?gamecode=powerball&language=en",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "X-Requested-With": "XMLHttpRequest",
        },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) throw new Error("Failed to fetch winning numbers");

    const html = await res.text();

    // White balls: <div class="form-control col white-balls item-powerball">3</div>
    const whiteBallMatches = [...html.matchAll(/white-balls item-powerball[^>]*>(\d+)<\/div>/g)];
    const whiteBalls = whiteBallMatches.map((m) => parseInt(m[1], 10));

    // Red Powerball: <div class="form-control col powerball item-powerball">1</div>
    const powerballMatch = html.match(/col powerball item-powerball[^>]*>(\d+)<\/div>/);
    const powerball = powerballMatch ? parseInt(powerballMatch[1], 10) : null;

    // Power Play: <span class="multiplier">4x</span>
    const powerPlayMatch = html.match(/<span class="multiplier">([^<]+)<\/span>/);
    const powerPlay = powerPlayMatch?.[1]?.trim() ?? null;

    // Draw date: title-date class
    const drawDateMatch = html.match(/title-date[^>]*>\s*([^<]+)<\/h5>/);
    const drawDate = drawDateMatch?.[1]?.trim() ?? null;

    if (whiteBalls.length !== 5 || !powerball) {
      return NextResponse.json(
        { error: "Could not parse winning numbers" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      whiteBalls,
      powerball,
      powerPlay,
      drawDate,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Numbers fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch winning numbers" },
      { status: 502 }
    );
  }
}
