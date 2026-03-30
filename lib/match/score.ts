import type { LawArticle } from "@/types/source";
import type { ResponseIntent } from "@/types/response";

const WEIGHT_PATTERN = 8;
const WEIGHT_KEYWORD = 4;
const WEIGHT_SYNONYM = 3;
const WEIGHT_ARTICLE_KW = 2;
const WEIGHT_PERCENT_RENT = 3;

function safeRegex(p: string): RegExp | null {
  try {
    return new RegExp(p, "i");
  } catch {
    return null;
  }
}

export function scoreIntent(
  intent: ResponseIntent,
  normalizedQuery: string,
  articleByNo: Map<string, LawArticle>,
  hints?: { percents: number[] },
): number {
  let score = 0;
  const q = normalizedQuery;

  for (const raw of intent.intentPatterns) {
    const p = raw.trim().toLowerCase();
    if (!p) continue;
    if (q.includes(p)) {
      score += WEIGHT_PATTERN;
      continue;
    }
    const rx = safeRegex(p);
    if (rx && rx.test(q)) score += WEIGHT_PATTERN;
  }

  for (const kw of intent.keywords) {
    const k = kw.trim().toLowerCase();
    if (k && q.includes(k)) score += WEIGHT_KEYWORD;
  }

  for (const syn of intent.synonyms) {
    const s = syn.trim().toLowerCase();
    if (s && q.includes(s)) score += WEIGHT_SYNONYM;
  }

  for (const no of intent.relatedArticleNos) {
    const art = articleByNo.get(no);
    if (!art?.keywords) continue;
    for (const kw of art.keywords) {
      const k = kw.trim().toLowerCase();
      if (k && q.includes(k)) score += WEIGHT_ARTICLE_KW;
    }
  }

  if (hints?.percents.length && intent.intentId === "rent-increase") {
    score += WEIGHT_PERCENT_RENT;
  }

  return score;
}
