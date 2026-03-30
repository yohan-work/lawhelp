"use client";

import intentData from "@/data/response/intents.json";

type Props = {
  disabled?: boolean;
  onPick: (q: string) => void;
};

export function ExampleChips({ disabled, onPick }: Props) {
  const examples = intentData.fallbackExamples;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-slate-500">예시 질문</p>
      <div className="flex flex-wrap gap-2">
        {examples.map((q) => (
          <button
            key={q}
            type="button"
            disabled={disabled}
            onClick={() => onPick(q)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-xs text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
