/**
 * 워드(.doc / .docx) → raw JSON → cleaned source JSON
 * 사용: npm run parse:word -- <파일경로> [출력디렉터리]
 * 예: npm run parse:word -- ./dataset/foo.doc ./data/source
 */

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import mammoth from "mammoth";
import WordExtractor from "word-extractor";
import rtfParse from "rtf-parser";

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

type RtfDoc = {
  content: { content: { value: string }[] }[];
};

function rtfDocumentToPlain(doc: RtfDoc): string {
  return doc.content
    .map((p) => p.content.map((s) => s.value).join(""))
    .join("\n")
    .trim();
}

function parseRtfString(rtf: string): Promise<string> {
  return new Promise((resolve, reject) => {
    rtfParse.string(rtf, (err, doc) => {
      if (err) reject(err);
      else resolve(rtfDocumentToPlain(doc as RtfDoc));
    });
  });
}

/** rtf-parser가 실패하는 비표준 RTF용 단순 추출(수동 보정 전제) */
function rtfFallbackPlain(rtf: string): string {
  let s = rtf.replace(/\r\n/g, "\n");
  s = s.replace(/\\par[d]?\s*/gi, "\n");
  s = s.replace(/\\line\s*/gi, "\n");
  s = s.replace(/\\tab\s*/gi, "\t");
  s = s.replace(/\\'([0-9a-f]{2})/gi, (_, h) =>
    String.fromCharCode(parseInt(h, 16)),
  );
  s = s.replace(/\\u(-?\d+)\??\s*/gi, (_, n) =>
    String.fromCharCode(Number.parseInt(n, 10)),
  );
  s = s.replace(/\{\*?\\[^{}]*\}/g, "");
  s = s.replace(/\\[a-zA-Z]+\d* ?/g, "");
  s = s.replace(/[{}]/g, "");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}

async function extractRtfText(buf: Buffer): Promise<string> {
  const asLatin = buf.toString("latin1");
  try {
    return await parseRtfString(asLatin);
  } catch {
    return rtfFallbackPlain(asLatin);
  }
}

function looksLikeRtf(buf: Buffer): boolean {
  const head = buf.subarray(0, Math.min(12, buf.length)).toString("latin1");
  return head.startsWith("{\\rtf");
}

async function extractText(
  filePath: string,
): Promise<{ text: string; format: "doc" | "docx" | "rtf" }> {
  const ext = path.extname(filePath).toLowerCase();
  const buf = await readFile(filePath);

  if (looksLikeRtf(buf)) {
    const text = await extractRtfText(buf);
    return { text, format: "rtf" };
  }

  if (ext === ".docx") {
    const { value } = await mammoth.extractRawText({ buffer: buf });
    return { text: value.trim(), format: "docx" };
  }

  if (ext === ".doc") {
    const extractor = new WordExtractor();
    const doc = await extractor.extract(filePath);
    const text = doc.getBody().trim();
    return { text, format: "doc" };
  }

  throw new Error(`지원하지 않는 형식입니다: ${ext} (.doc / .docx / RTF 권장)`);
}

function toParagraphs(text: string): string[] {
  return text
    .split(/\r?\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

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

  const { text, format } = await extractText(inputPath);
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
