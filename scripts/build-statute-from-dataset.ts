/**
 * dataset/data 평문 → data/guide + data/source JSON (원문 전량)
 * 실행: npx tsx scripts/build-statute-from-dataset.ts [입력파일]
 */

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { lawGuideDatasetSchema, lawSourceDatasetSchema } from "../lib/data/schemas";
import { isAppendixLine, matchLineArticleHead } from "./lib/articleHead";

const DEFAULT_INPUT = path.join(process.cwd(), "dataset", "data");

const GUIDE_DISCLAIMER =
  "이 페이지는 국가법령정보센터 등에서 정리한 조문 원문을 데이터에 옮긴 것입니다. 법률 자문이 아니며, 쉬운 해설은 이해를 돕기 위한 요약입니다. 실제 적용은 최신 공포 본문과 사실관계에 따릅니다.";

type Block =
  | { kind: "article"; articleNo: string; title?: string; lines: string[] }
  | { kind: "appendix"; lines: string[] };

function splitBlocks(text: string): { preamble: string; blocks: Block[] } {
  const rawLines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  const preambleLines: string[] = [];
  let current: Block | null = null;

  function flush() {
    if (!current) return;
    const nonempty = current.lines.some((l) => l.trim());
    if (nonempty) blocks.push(current);
    current = null;
  }

  for (const line of rawLines) {
    if (current?.kind === "appendix") {
      current.lines.push(line);
      continue;
    }
    if (isAppendixLine(line)) {
      flush();
      current = { kind: "appendix", lines: [line] };
      continue;
    }
    const head = matchLineArticleHead(line);
    if (head) {
      flush();
      current = {
        kind: "article",
        articleNo: head.articleNo,
        title: head.title,
        lines: [line],
      };
      continue;
    }
    if (current) current.lines.push(line);
    else preambleLines.push(line);
  }
  flush();

  return {
    preamble: preambleLines.join("\n").trim(),
    blocks,
  };
}

/** 검색용 조문 표기 (예: 3의2 → 제3조의2) */
function articleLabelKeyword(articleNo: string): string {
  if (articleNo === "부칙") return "부칙";
  const m = articleNo.match(/^(\d+)의(\d+)$/);
  if (m) return `제${m[1]}조의${m[2]}`;
  return `제${articleNo}조`;
}

function basicKeywords(articleNo: string, title?: string): string[] {
  const k = new Set<string>();
  k.add(articleNo);
  if (articleNo !== "부칙") {
    k.add(articleLabelKeyword(articleNo));
  }
  if (title) {
    title
      .split(/[\s·,]+/)
      .map((w) => w.replace(/[()]/g, "").trim())
      .filter((w) => w.length >= 2)
      .slice(0, 12)
      .forEach((w) => k.add(w));
  }
  return [...k];
}

type PrevGuideArticle = {
  articleNo: string;
  lines?: Array<{ easyInterpretation?: string }>;
};

async function loadPreservedGuideFields(guideOut: string): Promise<{
  easyByArticle: Map<string, string>;
  disclaimer?: string;
  preamble?: string;
}> {
  const easyByArticle = new Map<string, string>();
  try {
    const prevRaw = await readFile(guideOut, "utf-8");
    const prev = JSON.parse(prevRaw) as {
      articles?: PrevGuideArticle[];
      disclaimer?: string;
      preamble?: string;
    };
    for (const a of prev.articles ?? []) {
      const ez = a.lines?.[0]?.easyInterpretation;
      if (typeof ez === "string" && ez.trim()) easyByArticle.set(a.articleNo, ez);
    }
    return {
      easyByArticle,
      disclaimer: prev.disclaimer?.trim() || undefined,
      preamble: prev.preamble?.trim() || undefined,
    };
  } catch {
    return { easyByArticle };
  }
}

async function main() {
  const inputPath = path.resolve(process.cwd(), process.argv[2] ?? DEFAULT_INPUT);
  const raw = await readFile(inputPath, "utf-8");
  const { preamble, blocks } = splitBlocks(raw);

  const guideOut = path.join(process.cwd(), "data", "guide", "housing-rental-guide.json");
  const { easyByArticle, disclaimer: prevDisclaimer, preamble: prevPreamble } =
    await loadPreservedGuideFields(guideOut);

  const sourceArticles: Array<{
    articleNo: string;
    title?: string;
    fullText: string;
    keywords: string[];
    relatedArticleNos: string[];
  }> = [];

  const guideArticles: Array<{
    articleNo: string;
    title?: string;
    lines: Array<{ fullText: string; easyInterpretation: string }>;
  }> = [];

  for (const b of blocks) {
    const fullText = b.lines.join("\n").trim();
    if (!fullText) continue;

    if (b.kind === "appendix") {
      sourceArticles.push({
        articleNo: "부칙",
        title: "부칙",
        fullText,
        keywords: ["부칙"],
        relatedArticleNos: [],
      });
      guideArticles.push({
        articleNo: "부칙",
        title: "부칙",
        lines: [{ fullText, easyInterpretation: easyByArticle.get("부칙") ?? "" }],
      });
      continue;
    }

    sourceArticles.push({
      articleNo: b.articleNo,
      title: b.title,
      fullText,
      keywords: basicKeywords(b.articleNo, b.title),
      relatedArticleNos: [],
    });
    guideArticles.push({
      articleNo: b.articleNo,
      title: b.title,
      lines: [{ fullText, easyInterpretation: easyByArticle.get(b.articleNo) ?? "" }],
    });
  }

  const lawId = "housing-rental-protection";
  const lawName = "주택임대차보호법";
  const effectiveDate = "2026-01-02";
  const sourceUrl = "https://www.law.go.kr/법령/주택임대차보호법";

  const sourcePayload = {
    lawId,
    lawName,
    effectiveDate,
    sourceUrl,
    articles: sourceArticles,
  };
  const guidePayload = {
    lawId,
    lawName,
    effectiveDate,
    sourceUrl,
    disclaimer: prevDisclaimer ?? GUIDE_DISCLAIMER,
    preamble: preamble.trim() || prevPreamble || undefined,
    articles: guideArticles,
  };

  const sourceParsed = lawSourceDatasetSchema.parse(sourcePayload);
  const guideParsed = lawGuideDatasetSchema.parse(guidePayload);

  const sourceOut = path.join(process.cwd(), "data", "source", "housing-rental-protection.json");
  await mkdir(path.dirname(sourceOut), { recursive: true });
  await mkdir(path.dirname(guideOut), { recursive: true });

  await writeFile(sourceOut, JSON.stringify(sourceParsed, null, 2), "utf-8");
  await writeFile(guideOut, JSON.stringify(guideParsed, null, 2), "utf-8");

  const articleCount = blocks.filter((b) => b.kind === "article").length;
  const appendixCount = blocks.filter((b) => b.kind === "appendix").length;
  console.log("입력:", inputPath);
  console.log("조문 블록:", articleCount, "부칙:", appendixCount, "총 항목:", sourceArticles.length);
  console.log("저장:", sourceOut);
  console.log("저장:", guideOut);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
