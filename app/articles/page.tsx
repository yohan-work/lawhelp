import { readFile } from "fs/promises";
import path from "path";
import type { Metadata } from "next";
import Link from "next/link";
import { lawSourceDatasetSchema } from "@/lib/data/schemas";
import { formatArticleHeading, formatRelatedArticleRef } from "@/lib/formatArticleHeading";

export const metadata: Metadata = {
  title: "조항 목록 — 주택임대차보호법",
  description:
    "데이터셋에 정의된 주택임대차보호법 조문 목록과 요약 원문입니다. 법률 자문이 아닙니다.",
};

export default async function ArticlesPage() {
  const raw = await readFile(
    path.join(process.cwd(), "data", "source", "housing-rental-protection.json"),
    "utf-8",
  );
  const source = lawSourceDatasetSchema.parse(JSON.parse(raw));

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <p className="mb-2 text-sm text-slate-500">
        <Link href="/" className="text-slate-600 underline-offset-2 hover:underline">
          홈
        </Link>
        <span className="mx-2 text-slate-300">/</span>
        조항 목록
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{source.lawName}</h1>
      <p className="mt-2 text-sm text-slate-600">
        아래는 서비스 데이터(`data/source/housing-rental-protection.json`)에 포함된 조문입니다. 전문
        원문은 국가법령정보센터에서 확인하세요.
      </p>
      <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
        {source.effectiveDate && (
          <div className="flex gap-1">
            <dt className="text-slate-500">데이터 기준일</dt>
            <dd>{source.effectiveDate}</dd>
          </div>
        )}
        {source.sourceUrl && (
          <div className="flex gap-1">
            <dt className="text-slate-500">공식 링크</dt>
            <dd>
              <a
                href={source.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-800 underline decoration-slate-300 underline-offset-2"
              >
                법령 원문 보기
              </a>
            </dd>
          </div>
        )}
      </dl>

      <p className="mt-6 text-sm text-slate-500">
        총 <strong className="font-medium text-slate-700">{source.articles.length}</strong>개 조문
      </p>

      <ol className="mt-6 space-y-6">
        {source.articles.map((a, index) => (
          <li
            key={`${index}-${a.articleNo}`}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <h2 className="text-base font-semibold text-slate-900">
              {formatArticleHeading(a.articleNo, a.title)}
            </h2>
            {a.keywords && a.keywords.length > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                키워드:{" "}
                <span className="text-slate-600">{a.keywords.join(", ")}</span>
              </p>
            )}
            {a.relatedArticleNos && a.relatedArticleNos.length > 0 && (
              <p className="mt-1 text-xs text-slate-500">
                관련 조:{" "}
                {a.relatedArticleNos.map((no, i) => (
                  <span key={no}>
                    {i > 0 ? ", " : ""}
                    {formatRelatedArticleRef(no)}
                  </span>
                ))}
              </p>
            )}
            <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/80 p-3">
              <p className="text-xs font-medium text-slate-500">원문(데이터셋)</p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                {a.fullText}
              </p>
            </div>
            {a.easyInterpretation && (
              <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
                <p className="text-xs font-medium text-emerald-800">쉬운 해석</p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-emerald-950/90">
                  {a.easyInterpretation}
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-emerald-800/70">
                  일반 이해를 돕는 설명이며, 법률 자문이 아닙니다. 실제 적용은 원문·사실관계에 따라
                  달라질 수 있습니다.
                </p>
              </div>
            )}
          </li>
        ))}
      </ol>

      <p className="mt-10 text-xs leading-relaxed text-slate-500">
        이 페이지는 정보 안내용이며 법률 자문이 아닙니다. 실제 적용은 최신 법령과 개별 사실관계에
        따라 달라질 수 있습니다.
      </p>
    </main>
  );
}
