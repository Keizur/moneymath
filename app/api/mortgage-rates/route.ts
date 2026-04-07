import { NextResponse } from "next/server";

export const revalidate = 3600; // cache for 1 hour

export async function GET() {
  try {
    const res = await fetch("https://www.mortgagenewsdaily.com/mortgage-rates", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error(`MND responded ${res.status}`);

    const html = await res.text();

    // Rates are in a table: <td class="rate-product">30 Year Fixed</td> followed by <td class="rate">6.43%</td>
    // Also try: "30 Year Fixed" near a number like 6.43
    function extractRate(productPattern: string): number | null {
      // Primary: product name cell immediately followed by rate cell
      const re = new RegExp(
        `${productPattern}[\\s\\S]{0,200}?class="rate">([0-9]+\\.?[0-9]*)`,
        "i"
      );
      const m = html.match(re);
      if (m) return parseFloat(m[1]);
      return null;
    }

    const rate30 = extractRate("30 Year Fixed");
    const rate15 = extractRate("15 Year Fixed");

    // Fallback: look for any data-product attributes with known keys
    function extractByProductKey(key: string): number | null {
      const re = new RegExp(`data-product="${key}"[\\s\\S]{0,400}?class="rate">([0-9]+\\.?[0-9]*)`, "i");
      const m = html.match(re);
      if (m) return parseFloat(m[1]);
      return null;
    }

    const r30 = rate30 ?? extractByProductKey("30YRFRM");
    const r15 = rate15 ?? extractByProductKey("15YRFRM");

    if (!r30 && !r15) {
      return NextResponse.json({ error: "Could not parse rates from page" }, { status: 502 });
    }

    return NextResponse.json({
      rate30: r30,
      rate15: r15,
      source: "Mortgage News Daily",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Mortgage rate fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch rates" }, { status: 502 });
  }
}
