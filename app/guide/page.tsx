import type { Metadata } from "next";
import Link from "next/link";
import { GuideContent } from "@/components/GuideContent";
import { loadLawGuide } from "@/lib/data/loadGuide";

export const metadata: Metadata = {
  title: "쉬운 해설 — 주택임대차보호법",
  description:
    "주택임대차보호법을 일반인 관점에서 쉽게 훑어보는 안내 데이터입니다. 법률 자문이 아닙니다.",
};

export default async function GuidePage() {
  const guide = await loadLawGuide();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="mb-2 text-sm text-slate-500">
        <Link href="/" className="text-slate-600 underline-offset-2 hover:underline">
          홈
        </Link>
        <span className="mx-2 text-slate-300">/</span>
        쉬운 해설
      </p>
      <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{guide.lawName}</h1>
        {guide.effectiveDate && (
          <p className="mt-1 text-sm text-slate-500">데이터 기준일: {guide.effectiveDate}</p>
        )}
        <div className="mt-6">
          <GuideContent data={guide} />
        </div>
      </article>
    </main>
  );
}
