import Fuse from "fuse.js";
import type { ChatApiResponse, LoadedDatasets } from "@/types/api";
import type { ResponseIntent } from "@/types/response";
import { extractHints } from "./extract";
import {
  applySynonyms,
  buildSynonymReplaceMap,
  normalizeQuestion,
} from "./normalize";
import { scoreIntent } from "./score";

const MIN_SCORE = 5;
const RELATED_COUNT = 4;

function articleMap(source: LoadedDatasets["source"]) {
  const m = new Map<string, (typeof source.articles)[0]>();
  for (const a of source.articles) m.set(a.articleNo, a);
  return m;
}

function fuzzyPickIntent(
  query: string,
  intents: ResponseIntent[],
): ResponseIntent | null {
  if (!query.trim()) return null;
  const fuse = new Fuse(intents, {
    keys: ["title", "keywords", "synonyms"],
    threshold: 0.42,
    ignoreLocation: true,
  });
  const r = fuse.search(query, { limit: 1 });
  return r[0]?.item ?? null;
}

function relatedIntents(
  best: ResponseIntent,
  all: ResponseIntent[],
  limit: number,
): { intentId: string; title: string }[] {
  const set = new Set(best.relatedArticleNos);
  const scored = all
    .filter((i) => i.intentId !== best.intentId)
    .map((i) => {
      const overlap = i.relatedArticleNos.filter((n) => set.has(n)).length;
      return { i, overlap };
    })
    .filter((x) => x.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, limit)
    .map((x) => ({ intentId: x.i.intentId, title: x.i.title }));
  return scored;
}

export function runMatchEngine(
  question: string,
  datasets: LoadedDatasets,
): ChatApiResponse {
  const { source, response, synonyms } = datasets;
  const normalized = normalizeQuestion(question);
  const synMap = buildSynonymReplaceMap(synonyms.entries);
  const expanded = applySynonyms(normalized, synMap);
  const hints = extractHints(question);
  const byNo = articleMap(source);

  const scored = response.intents.map((intent) => ({
    intent,
    score: scoreIntent(intent, expanded, byNo, {
      percents: hints.percents,
    }),
  }));

  for (const [topic, nos] of Object.entries(datasets.topicMap.topics)) {
    if (!expanded.includes(topic)) continue;
    for (const row of scored) {
      const hit = row.intent.relatedArticleNos.some((n) => nos.includes(n));
      if (hit) row.score += 2;
    }
  }

  scored.sort((a, b) => b.score - a.score);
  let best = scored[0]?.intent ?? null;
  let bestScore = scored[0]?.score ?? 0;

  if (bestScore < MIN_SCORE || !best) {
    const fuzzy = fuzzyPickIntent(expanded, response.intents);
    if (fuzzy) {
      best = fuzzy;
      bestScore = MIN_SCORE;
    }
  }

  if (bestScore < MIN_SCORE || !best) {
    return {
      ok: true,
      matched: false,
      fallbackMessage: response.fallbackMessage,
      fallbackExamples: response.fallbackExamples,
      sourceUrl: source.sourceUrl,
    };
  }

  const articles = best.relatedArticleNos
    .map((no) => byNo.get(no))
    .filter(Boolean)
    .map((a) => ({
      articleNo: a!.articleNo,
      title: a!.title,
      fullText: a!.fullText,
      easyInterpretation: a!.easyInterpretation,
    }));

  return {
    ok: true,
    matched: true,
    score: bestScore,
    intent: best,
    articles,
    relatedQuestions: relatedIntents(best, response.intents, RELATED_COUNT),
    answerSummary: best.answerSummary,
    answerDetail: best.answerDetail,
    answerPrefix: best.answerPrefix,
    disclaimer: best.disclaimer,
    cautions: best.cautions,
    sourceUrl: source.sourceUrl,
  };
}
