/**
 * 원문 + 쉬운 해석 워드 → raw + generated JSON (`lines[]` 지원)
 * 사용: npm run parse:guide -- <워드파일> [출력폴더] [--write-guide]
 * 규칙: docs/word-template-law-guide.md 참고
 */

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { lawGuideDatasetSchema } from "../lib/data/schemas";
import { articleHeadGlobalRegex, articleNoFromHeadGroups } from "./lib/articleHead";
import { extractDocumentText, toParagraphs } from "./lib/extractDocumentText";

type RulesMeta = {
  lawId: string;
  lawName: string;
  effectiveDate?: string;
  sourceUrl?: string;
};

type GuideLine = { fullText: string; easyInterpretation: string };

const EASY_MARKER = /쉬운\s*해석\s*[:：]/;
const LINE_ORIG_MARKER = /^\s*<<<\s*원문\s*>>>\s*$/;
const LINE_EASY_MARKER = /^\s*<<<\s*쉬운\s*>>>\s*$/;

const GUIDE_DISCLAIMER =
  "이 페이지는 작성·파싱해 둔 안내 데이터를 보여 줍니다. 법률 자문이 아니며, 실제 적용은 국가법령정보센터 최신 원문과 개별 사실관계에 따라 달라질 수 있습니다.";

type ParsedArticle = {
  articleNo: string;
  title?: string;
  lines: GuideLine[];
  fullText: string;
  easyInterpretation?: string;
  parseWarnings?: string[];
};

function stripArticleHeadPrefix(block: string): string {
  const m = block.match(/^\s*제\s*(\d+)\s*조(?:의(\d+))?(?:\(([^)]*)\))?\s*/);
  if (!m) return block.trim();
  return block.slice(m.index! + m[0].length).trim();
}

function hasLineMarkers(body: string): boolean {
  return /<<<\s*원문\s*>>>/.test(body);
}

function parseMarkedLinePairs(body: string): { lines: GuideLine[]; warnings: string[] } {
  const warnings: string[] = [];
  const rawLines = body.replace(/\r\n/g, "\n").split("\n");

  const enum Phase {
    Before,
    Orig,
    Easy,
  }
  let phase = Phase.Before;
  let origBuf: string[] = [];
  let easyBuf: string[] = [];
  const pairs: GuideLine[] = [];

  function flushPair() {
    pairs.push({
      fullText: origBuf.join("\n").trim(),
      easyInterpretation: easyBuf.join("\n").trim(),
    });
    origBuf = [];
    easyBuf = [];
  }

  for (const line of rawLines) {
    if (LINE_ORIG_MARKER.test(line)) {
      if (phase === Phase.Easy) {
        flushPair();
      } else if (phase === Phase.Orig && origBuf.some((l) => l.trim())) {
        warnings.push("이전 원문 블록을 닫지 않고 <<<원문>>>이 다시 나왔습니다.");
        flushPair();
      } else if (phase === Phase.Orig && !origBuf.some((l) => l.trim())) {
        warnings.push("빈 원문 블록 뒤에 <<<원문>>>이 다시 나왔습니다.");
      }
      phase = Phase.Orig;
      continue;
    }
    if (LINE_EASY_MARKER.test(line)) {
      if (phase !== Phase.Orig) {
        warnings.push("<<<쉬운>>> 앞에 유효한 <<<원문>>> 블록이 없습니다.");
        if (phase === Phase.Easy) flushPair();
      }
      phase = Phase.Easy;
      continue;
    }
    if (phase === Phase.Orig) origBuf.push(line);
    else if (phase === Phase.Easy) easyBuf.push(line);
    else {
      const t = line.trim();
      if (t) warnings.push(`첫 <<<원문>>> 이전에 본문이 있습니다: ${t.slice(0, 60)}`);
    }
  }

  if (phase === Phase.Orig) {
    warnings.push("마지막 <<<원문>>> 뒤에 <<<쉬운>>>이 없습니다.");
    pairs.push({
      fullText: origBuf.join("\n").trim(),
      easyInterpretation: "",
    });
  } else if (phase === Phase.Easy) {
    flushPair();
  }

  if (pairs.length === 0 && hasLineMarkers(body)) {
    warnings.push("<<<원문>>> 마커는 있으나 원문·쉬운 쌍을 만들지 못했습니다.");
  }

  pairs.forEach((p, i) => {
    const n = i + 1;
    if (!p.fullText) warnings.push(`쌍 ${n}: 원문이 비어 있습니다.`);
    if (!p.easyInterpretation) warnings.push(`쌍 ${n}: 쉬운 해석이 비어 있습니다.`);
  });

  return { lines: pairs, warnings };
}

function splitEasyBlock(block: string): {
  fullText: string;
  easyInterpretation?: string;
  warnings: string[];
} {
  const warnings: string[] = [];
  const m = block.match(EASY_MARKER);
  if (!m || m.index === undefined) {
    warnings.push("쉬운 해석 마커(쉬운 해석: 또는 쉬운 해석：) 없음");
    return { fullText: block.trim(), warnings };
  }
  const fullText = block.slice(0, m.index).trim();
  const easyInterpretation = block.slice(m.index + m[0].length).trim();
  if (!easyInterpretation) warnings.push("쉬운 해석 본문이 비어 있음");
  return { fullText, easyInterpretation: easyInterpretation || undefined, warnings };
}

function parseArticleBlock(block: string): ParsedArticle {
  const m = block.match(/^\s*제\s*(\d+)\s*조(?:의(\d+))?(?:\(([^)]*)\))?/);
  const articleNo = m ? articleNoFromHeadGroups(m[1], m[2]) : "?";
  const title = m?.[3]?.trim() || undefined;

  const body = stripArticleHeadPrefix(block);
  const allWarnings: string[] = [];

  let lines: GuideLine[];
  let fullText: string;
  let easyInterpretation: string | undefined;

  if (hasLineMarkers(body)) {
    const { lines: parsedLines, warnings } = parseMarkedLinePairs(body);
    allWarnings.push(...warnings);
    if (parsedLines.length > 0) {
      lines = parsedLines;
      fullText = lines.map((l) => l.fullText).join("\n\n").trim();
      const joinedEasy = lines.map((l) => l.easyInterpretation).join("\n\n").trim();
      easyInterpretation = joinedEasy || undefined;
    } else {
      allWarnings.push("줄 단위 마커가 있었으나 쌍이 비어 있어, 조문 전체를 한 쌍으로 저장합니다.");
      const { fullText: ft, easyInterpretation: ez, warnings: w2 } = splitEasyBlock(block);
      allWarnings.push(...w2);
      fullText = ft;
      easyInterpretation = ez;
      lines = [{ fullText: ft, easyInterpretation: ez ?? "" }];
    }
  } else {
    const { fullText: ft, easyInterpretation: ez, warnings } = splitEasyBlock(block);
    allWarnings.push(...warnings);
    fullText = ft;
    easyInterpretation = ez;
    lines = [{ fullText: ft, easyInterpretation: ez ?? "" }];
  }

  return {
    articleNo,
    title,
    lines,
    fullText,
    easyInterpretation,
    parseWarnings: allWarnings.length ? allWarnings : undefined,
  };
}

function parseGuidePlainText(plainText: string): {
  preamble?: string;
  articles: ParsedArticle[];
  globalWarnings: string[];
} {
  const globalWarnings: string[] = [];
  const normalized = plainText.replace(/\r\n/g, "\n").trim();
  const matches = [...normalized.matchAll(articleHeadGlobalRegex())];

  if (matches.length === 0) {
    globalWarnings.push("제N조 형식의 조문 시작을 찾지 못했습니다.");
    return { articles: [], globalWarnings };
  }

  const firstIdx = matches[0].index ?? 0;
  const preamble =
    firstIdx > 0 ? normalized.slice(0, firstIdx).trim() || undefined : undefined;

  const articles: ParsedArticle[] = [];

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const start = m.index ?? 0;
    const end =
      i + 1 < matches.length ? (matches[i + 1].index ?? normalized.length) : normalized.length;
    const block = normalized.slice(start, end).trim();
    articles.push(parseArticleBlock(block));
  }

  return { preamble, articles, globalWarnings };
}

function parseArgs(argv: string[]) {
  const writeGuide = argv.includes("--write-guide");
  const pos = argv.filter((a) => a !== "--write-guide");
  return { writeGuide, inputArg: pos[0], outDirArg: pos[1] };
}

async function main() {
  const { writeGuide, inputArg, outDirArg } = parseArgs(process.argv.slice(2));
  if (!inputArg) {
    console.error("사용법: npm run parse:guide -- <워드파일> [출력폴더] [--write-guide]");
    process.exit(1);
  }

  const inputPath = path.resolve(process.cwd(), inputArg);
  const outDir = path.resolve(process.cwd(), outDirArg ?? path.join("data", "source"));
  const rawDir = path.join(outDir, "raw");
  const genDir = path.join(outDir, "generated");
  await mkdir(rawDir, { recursive: true });
  await mkdir(genDir, { recursive: true });

  const rulesPath = path.join(process.cwd(), "scripts", "parse-rules", "housing-rental.example.json");
  const rules = JSON.parse(await readFile(rulesPath, "utf-8")) as RulesMeta;

  const { text, format } = await extractDocumentText(inputPath);
  const paragraphs = toParagraphs(text);

  const rawOut = path.join(rawDir, `${rules.lawId}-guide-raw.json`);
  await writeFile(
    rawOut,
    JSON.stringify(
      {
        meta: {
          sourceFile: path.basename(inputPath),
          extractedAt: new Date().toISOString(),
          format,
        },
        paragraphs,
        plainText: text,
      },
      null,
      2,
    ),
    "utf-8",
  );
  console.log("raw 저장:", rawOut);

  const { preamble, articles, globalWarnings } = parseGuidePlainText(text);

  const generated = {
    lawId: rules.lawId,
    lawName: rules.lawName,
    effectiveDate: rules.effectiveDate || undefined,
    sourceUrl: rules.sourceUrl,
    preamble: preamble || undefined,
    globalParseWarnings: globalWarnings.length ? globalWarnings : undefined,
    articles,
  };

  const genOut = path.join(genDir, `${rules.lawId}-from-guide.generated.json`);
  await writeFile(genOut, JSON.stringify(generated, null, 2), "utf-8");
  console.log("generated 저장:", genOut);

  if (writeGuide) {
    const guideDir = path.join(process.cwd(), "data", "guide");
    await mkdir(guideDir, { recursive: true });
    const guideOut = path.join(guideDir, "housing-rental-guide.json");
    let disclaimer = GUIDE_DISCLAIMER;
    let effectiveDate = rules.effectiveDate?.trim() ? rules.effectiveDate : undefined;
    try {
      const prev = JSON.parse(await readFile(guideOut, "utf-8")) as {
        disclaimer?: string;
        effectiveDate?: string;
      };
      if (!effectiveDate && prev.effectiveDate?.trim()) effectiveDate = prev.effectiveDate;
      if (prev.disclaimer?.trim()) disclaimer = prev.disclaimer;
    } catch {
      /* 최초 생성 */
    }
    const guidePayload = {
      lawId: rules.lawId,
      lawName: rules.lawName,
      effectiveDate,
      sourceUrl: rules.sourceUrl,
      disclaimer,
      preamble: preamble || undefined,
      articles: articles.map((a) => ({
        articleNo: a.articleNo,
        title: a.title,
        lines: a.lines,
        parseWarnings: a.parseWarnings,
      })),
    };
    const parsed = lawGuideDatasetSchema.parse(guidePayload);
    await writeFile(guideOut, JSON.stringify(parsed, null, 2), "utf-8");
    console.log("가이드 페이지용 저장:", guideOut);
  }

  const warnCount = articles.filter((a) => a.parseWarnings?.length).length;
  if (globalWarnings.length) console.warn("전역 경고:", globalWarnings);
  if (warnCount) console.warn(`조문별 경고가 있는 항목: ${warnCount}개 (파일에서 parseWarnings 확인)`);
  console.log(
    "검수 후 keywords·relatedArticleNos 등을 보강해 housing-rental-protection.json에 합치세요.",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
