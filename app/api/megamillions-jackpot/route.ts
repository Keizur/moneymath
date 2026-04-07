import { NextResponse } from "next/server";

export const revalidate = 3600;

function parseDollarAmount(str: string): number | null {
  const clean = str.trim().replace(/,/g, "");
  const match = clean.match(/\$?([\d.]+)\s*(M(?:illion)?|B(?:illion)?)?/i);
  if (!match) return null;
  const num = parseFloat(match[1]);
  const suffix = match[2]?.toLowerCase();
  if (!suffix) return Math.round(num);
  if (suffix.startsWith("b")) return Math.round(num * 1_000_000_000);
  if (suffix.startsWith("m")) return Math.round(num * 1_000_000);
  return Math.round(num);
}

function formatRaw(amount: number): string {
  if (amount >= 1_000_000_000)
    return `$${(amount / 1_000_000_000).toFixed(amount % 1_000_000_000 === 0 ? 0 : 1)} Billion`;
  if (amount >= 1_000_000)
    return `$${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)} Million`;
  return `$${amount.toLocaleString()}`;
}

function parseDrawDateUTC(dateStr: string): string | null {
  if (/today/i.test(dateStr)) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}T12:00:00.000Z`;
  }
  if (/tomorrow/i.test(dateStr)) {
    const tom = new Date(Date.now() + 86400000);
    const y = tom.getFullYear();
    const m = String(tom.getMonth() + 1).padStart(2, "0");
    const d = String(tom.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}T12:00:00.000Z`;
  }
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

async function tryFetch(url: string): Promise<{ ok: boolean; status: number; html: string }> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
    next: { revalidate: 3600 },
  });
  const html = await res.text();
  return { ok: res.ok, status: res.status, html };
}

export async function GET() {
  const sources = [
    {
      url: "https://www.lotterypost.com/jackpots",
      extract: (html: string) => {
        const mmRow = html.match(
          /<tr[^>]*>(?:(?!<\/tr>)[\s\S])*?Mega\s+Millions(?:(?!<\/tr>)[\s\S])*?<\/tr>/i
        );
        if (!mmRow) return null;
        const jackpotMatch = mmRow[0].match(/\$([\d,]+(?:\.\d+)?)\s*(Million|Billion|M\b|B\b)/i);
        const dateMatch = mmRow[0].match(
          /(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d+),?\s+(\d{4})/i
        );
        if (!jackpotMatch) return null;
        const jackpot = parseDollarAmount(`${jackpotMatch[1]} ${jackpotMatch[2]}`);
        if (!jackpot) return null;
        return { jackpot, dateStr: dateMatch?.[0] ?? null };
      },
    },
    {
      url: "https://www.lotteryusa.com/mega-millions/",
      extract: (html: string) => {
        // Jackpot: find first $X Million/Billion after "est. jackpot"
        const jackpotSection = html.match(/est\.?\s+jackpot[\s\S]{0,800}/i);
        const jackpotMatch = jackpotSection?.[0]?.match(
          /\$([\d,]+(?:\.\d+)?)\s*(Million|Billion)/i
        );
        // Cash value: "Cash value: $X Million"
        const cashMatch = html.match(
          /[Cc]ash\s+value:?\s*\$([\d,]+(?:\.\d+)?)\s*(Million|Billion)/i
        );
        // Draw date: day of week pattern
        const dateMatch = html.match(
          /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Today|Tomorrow)[^<\n"]{0,40}(?:am|pm)[^<\n"]{0,20}/i
        );
        if (!jackpotMatch) return null;
        const jackpot = parseDollarAmount(`${jackpotMatch[1]} ${jackpotMatch[2]}`);
        if (!jackpot) return null;
        const cashFromMatch = cashMatch
          ? parseDollarAmount(`${cashMatch[1]} ${cashMatch[2]}`)
          : null;
        return { jackpot, cashOverride: cashFromMatch ?? undefined, dateStr: dateMatch?.[0]?.trim() ?? null };
      },
    },
  ];

  const errors: string[] = [];

  for (const source of sources) {
    try {
      const { ok, status, html } = await tryFetch(source.url);
      if (!ok) {
        errors.push(`${source.url} → HTTP ${status}`);
        continue;
      }
      const result = source.extract(html);
      if (!result) {
        errors.push(`${source.url} → parse failed (html length: ${html.length})`);
        continue;
      }

      const { jackpot, dateStr } = result;
      const cashOverride = (result as { cashOverride?: number }).cashOverride;
      const cashValue = cashOverride ?? Math.round(jackpot * 0.6);
      const jackpotRaw = formatRaw(jackpot);
      const cashValueRaw = formatRaw(cashValue);
      const drawDateUTC = dateStr ? parseDrawDateUTC(dateStr) : null;
      const nextDrawingLabel = dateStr ?? null;

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
      errors.push(`${source.url} → ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({ error: "All sources failed", details: errors }, { status: 502 });
}
