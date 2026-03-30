"use client";

import { formatArticleHeading } from "@/lib/formatArticleHeading";
import type { ChatApiResponse } from "@/types/api";

const LONG_ORIGINAL_THRESHOLD = 400;

type Props = {
  response: ChatApiResponse;
  onRelatedClick: (question: string) => void;
};

export function AnswerCard({ response, onRelatedClick }: Props) {
  if (!response.matched) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
        <p className="font-medium">매칭 결과 없음</p>
        <p className="mt-2 text-amber-900/90">{response.fallbackMessage}</p>
        {response.fallbackExamples && response.fallbackExamples.length > 0 && (
          <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-amber-900/85">
            {response.fallbackExamples.map((ex) => (
              <li key={ex}>{ex}</li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-amber-800/80">
          구체적인 날짜·금액·통지 여부를 함께 적으면 검색에 도움이 됩니다.
        </p>
      </div>
    );
  }

  const articles = response.articles ?? [];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
      {response.answerPrefix && (
        <p className="text-xs font-medium text-slate-500">{response.answerPrefix}</p>
      )}
      <p className="mt-1 font-semibold text-slate-900">{response.answerSummary}</p>
      <p className="mt-2 leading-relaxed text-slate-700">{response.answerDetail}</p>
      {response.disclaimer && (
        <p className="mt-2 border-l-2 border-slate-300 pl-3 text-xs text-slate-600">
          {response.disclaimer}
        </p>
      )}

      {response.relatedQuestions && response.relatedQuestions.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-slate-500">관련 질문</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {response.relatedQuestions.map((rq) => (
              <button
                key={rq.intentId}
                type="button"
                onClick={() => onRelatedClick(rq.title)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
              >
                {rq.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {articles.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-xs font-medium text-slate-500">관련 조문 · 원문(데이터셋)</p>
          <ul className="mt-2 space-y-3">
            {articles.map((a) => {
              const long = a.fullText.length > LONG_ORIGINAL_THRESHOLD;
              return (
                <li
                  key={a.articleNo}
                  className="rounded-lg border border-slate-100 bg-slate-50/90 px-3 py-2"
                >
                  <p className="font-medium text-slate-800">
                    {formatArticleHeading(a.articleNo, a.title)}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">원문(데이터셋)</p>
                  <p
                    className={`mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-slate-700 ${
                      long ? "max-h-56 overflow-y-auto pr-1" : ""
                    }`}
                  >
                    {a.fullText}
                  </p>
                  {long && (
                    <p className="mt-1 text-[11px] text-slate-400">긴 원문은 위 영역 안에서 스크롤할 수 있습니다.</p>
                  )}
                  {a.easyInterpretation && (
                    <div className="mt-3 border-t border-slate-200/80 pt-3">
                      <p className="text-xs font-medium text-emerald-800">쉬운 해석</p>
                      <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-emerald-950/90">
                        {a.easyInterpretation}
                      </p>
                      <p className="mt-1.5 text-[11px] text-emerald-800/70">
                        일반 이해용이며 법률 자문이 아닙니다.
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {response.cautions && response.cautions.length > 0 && (
        <div className="mt-4 rounded-lg bg-amber-50/80 px-3 py-2">
          <p className="text-xs font-medium text-amber-900">주의사항</p>
          <ul className="mt-1 list-inside list-disc space-y-1 text-xs text-amber-950/90">
            {response.cautions.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {response.sourceUrl && (
        <p className="mt-4 text-xs text-slate-500">
          공식 법령 원문:{" "}
          <a
            href={response.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-700 underline underline-offset-2"
          >
            {response.sourceUrl}
          </a>
        </p>
      )}
    </div>
  );
}
