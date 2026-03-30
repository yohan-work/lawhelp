import { formatArticleHeading } from "@/lib/formatArticleHeading";
import type { LawGuideDataset } from "@/types/guide";

type Props = { data: LawGuideDataset };

export function GuideContent({ data }: Props) {
  return (
    <div className="text-sm text-slate-800">
      <p className="mb-4 leading-relaxed text-slate-600">{data.disclaimer}</p>
      {data.sourceUrl && (
        <p className="mb-6 text-sm">
          <a
            href={data.sourceUrl}
            className="font-medium text-slate-800 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            국가법령정보센터 — {data.lawName}
          </a>
        </p>
      )}
      {data.preamble && (
        <p className="mb-8 whitespace-pre-wrap leading-relaxed text-slate-600">{data.preamble}</p>
      )}

      <ol className="space-y-10">
        {data.articles.map((article, articleIdx) => (
          <li key={`${article.articleNo}-${articleIdx}`} className="scroll-mt-4">
            <h2 className="text-base font-semibold text-slate-900">
              {formatArticleHeading(article.articleNo, article.title)}
            </h2>
            {article.parseWarnings && article.parseWarnings.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-xs text-amber-800">
                {article.parseWarnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            )}
            <div className="mt-3 space-y-5">
              {article.lines.map((line, lineIdx) => (
                <div
                  key={`${article.articleNo}-${articleIdx}-L${lineIdx}`}
                  className="rounded-lg border border-slate-200 bg-white"
                >
                  <div className="border-b border-slate-100 bg-slate-50/80 px-3 py-2">
                    <p className="text-xs font-semibold text-slate-600">원문(데이터)</p>
                  </div>
                  <div className="px-3 py-3">
                    <p className="whitespace-pre-wrap leading-relaxed text-slate-800">{line.fullText}</p>
                  </div>
                  <div className="border-t border-emerald-100 bg-emerald-50/40 px-3 py-2">
                    <p className="text-xs font-semibold text-emerald-900">쉬운 해설</p>
                  </div>
                  <div className="px-3 py-3">
                    <p className="whitespace-pre-wrap leading-relaxed text-emerald-950/90">
                      {line.easyInterpretation.trim()
                        ? line.easyInterpretation
                        : "— (쉬운 해석 없음)"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
