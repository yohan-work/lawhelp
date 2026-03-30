/**
 * .doc / .docx / RTF(확장자 .doc) 텍스트 추출 — parse-word, parse-law-guide-doc 공통
 */

import { readFile } from "fs/promises";
import path from "path";
import mammoth from "mammoth";
import WordExtractor from "word-extractor";
import rtfParse from "rtf-parser";

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

export type ExtractResult = {
  text: string;
  format: "doc" | "docx" | "rtf";
};

export async function extractDocumentText(filePath: string): Promise<ExtractResult> {
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

export function toParagraphs(text: string): string[] {
  return text
    .split(/\r?\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}
