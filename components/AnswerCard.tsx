"use client";

import { useState } from "react";
import type { ChatApiResponse } from "@/types/api";

type Props = {
  response: ChatApiResponse;
  onRelatedClick: (question: string) => void;
};

export function AnswerCard({ response, onRelatedClick }: Props) {
  const [openArticles, setOpenArticles] = useState<Record<string, boolean>>({});
  const [showRawBlock, setShowRawBlock] = useState(false);

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
          <p className="text-xs font-medium text-slate-500">관련 조문</p>
          <ul className="mt-2 space-y-2">
            {articles.map((a) => (
              <li key={a.articleNo} className="rounded-lg bg-slate-50 px-3 py-2">
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-left font-medium text-slate-800"
                  onClick={() =>
                    setOpenArticles((o) => ({
                      ...o,
                      [a.articleNo]: !o[a.articleNo],
                    }))
                  }
                  aria-expanded={!!openArticles[a.articleNo]}
                >
                  <span>
                    제{a.articleNo}조
                    {a.title ? ` (${a.title})` : ""}
                  </span>
                  <span className="text-xs text-slate-500">
                    {openArticles[a.articleNo] ? "접기" : "원문 보기"}
                  </span>
                </button>
                {openArticles[a.articleNo] && (
                  <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-600">
                    {a.fullText}
                  </p>
                )}
              </li>
            ))}
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

      {articles.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            className="text-xs font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-slate-900"
            onClick={() => setShowRawBlock((v) => !v)}
            aria-expanded={showRawBlock}
          >
            {showRawBlock ? "원문 한꺼번에 접기" : "원문 한꺼번에 펼치기"}
          </button>
          {showRawBlock && (
            <div className="mt-2 max-h-64 overflow-y-auto rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              {articles.map((a) => (
                <section key={a.articleNo} className="mb-3 last:mb-0">
                  <h4 className="font-semibold text-slate-800">
                    제{a.articleNo}조 {a.title ?? ""}
                  </h4>
                  <p className="mt-1 whitespace-pre-wrap">{a.fullText}</p>
                </section>
              ))}
            </div>
          )}
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
