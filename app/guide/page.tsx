import { readFile } from "fs/promises";
import path from "path";
import type { Metadata } from "next";
import Link from "next/link";
import { MarkdownBody } from "@/components/MarkdownBody";

export const metadata: Metadata = {
  title: "쉬운 해설 — 주택임대차보호법",
  description:
    "주택임대차보호법을 일반인 관점에서 쉽게 훑어보는 안내 문서입니다. 법률 자문이 아닙니다.",
};

export default async function GuidePage() {
  const mdPath = path.join(process.cwd(), "docs", "easy-interpretation.md");
  const content = await readFile(mdPath, "utf-8");

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <p className="mb-2 text-sm text-slate-500">
        <Link href="/" className="text-slate-600 underline-offset-2 hover:underline">
          홈
        </Link>
        <span className="mx-2 text-slate-300">/</span>
        쉬운 해설
      </p>
      <p className="mb-6 text-xs text-slate-500">
        원문은 저장소의 <code className="rounded bg-slate-100 px-1">docs/easy-interpretation.md</code>
        에서 관리합니다.
      </p>
      <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <MarkdownBody content={content} />
      </article>
    </main>
  );
}
