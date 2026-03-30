/**
 * 워드(.doc / .docx) → raw JSON → cleaned source JSON
 * 사용: npm run parse:word -- <파일경로> [출력디렉터리]
 * 예: npm run parse:word -- ./dataset/foo.doc ./data/source
 */

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { extractDocumentText, toParagraphs } from "./lib/extractDocumentText";

type ParseRules = {
  lawId: string;
  lawName: string;
  effectiveDate?: string;
  sourceUrl?: string;
  articleHeadingPattern: string;
};

type RawDocJson = {
  meta: {
    sourceFile: string;
    extractedAt: string;
    format: "doc" | "docx" | "rtf";
  };
  paragraphs: string[];
  plainText: string;
};

function splitArticles(plainText: string, pattern: string) {
  const re = new RegExp(pattern, "g");
  const matches = [...plainText.matchAll(re)];
  if (matches.length === 0) {
    return [
      {
        articleNo: "1",
        title: undefined as string | undefined,
        fullText: plainText.trim(),
        keywords: [] as string[],
        relatedArticleNos: [] as string[],
      },
    ];
  }

  const articles: {
    articleNo: string;
    title?: string;
    fullText: string;
    keywords: string[];
    relatedArticleNos: string[];
  }[] = [];

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const articleNo = m[1] ?? "?";
    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? plainText.length) : plainText.length;
    const chunk = plainText.slice(start, end).trim();
    articles.push({
      articleNo,
      fullText: `제${articleNo}조 ${chunk}`.trim(),
      keywords: [],
      relatedArticleNos: [],
    });
  }

  return articles;
}

async function main() {
  const [, , inputArg, outDirArg] = process.argv;
  if (!inputArg) {
    console.error("사용법: npm run parse:word -- <워드파일> [출력폴더]");
    process.exit(1);
  }

  const inputPath = path.resolve(process.cwd(), inputArg);
  const outDir = path.resolve(process.cwd(), outDirArg ?? path.join("data", "source"));
  const rawDir = path.join(outDir, "raw");
  await mkdir(rawDir, { recursive: true });

  const rulesPath = path.join(process.cwd(), "scripts", "parse-rules", "housing-rental.example.json");
  const rulesRaw = await readFile(rulesPath, "utf-8");
  const rules = JSON.parse(rulesRaw) as ParseRules;

  const { text, format } = await extractDocumentText(inputPath);
  const paragraphs = toParagraphs(text);

  const raw: RawDocJson = {
    meta: {
      sourceFile: path.basename(inputPath),
      extractedAt: new Date().toISOString(),
      format,
    },
    paragraphs,
    plainText: text,
  };

  const baseName = rules.lawId;
  const rawOut = path.join(rawDir, `${baseName}-raw.json`);
  await writeFile(rawOut, JSON.stringify(raw, null, 2), "utf-8");
  console.log("raw 저장:", rawOut);

  const articles = splitArticles(text, rules.articleHeadingPattern);
  const cleaned = {
    lawId: rules.lawId,
    lawName: rules.lawName,
    effectiveDate: rules.effectiveDate || undefined,
    sourceUrl: rules.sourceUrl,
    articles,
  };

  const genDir = path.join(outDir, "generated");
  await mkdir(genDir, { recursive: true });
  const cleanedOut = path.join(genDir, `${baseName}.generated.json`);
  await writeFile(cleanedOut, JSON.stringify(cleaned, null, 2), "utf-8");
  console.log("cleaned(생성본) 저장:", cleanedOut);
  console.log(
    "앱은 data/source/housing-rental-protection.json 등 수동 검수본을 사용합니다. 생성본을 반영하려면 필드를 합치거나 조문 분리 규칙을 조정하세요.",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
