"use client";

import { useCallback, useState } from "react";
import { AnswerCard } from "@/components/AnswerCard";
import { ChatMessage } from "@/components/ChatMessage";
import { ExampleChips } from "@/components/ExampleChips";
import type { ChatApiResponse } from "@/types/api";

type ChatRole = "user" | "assistant";

type ChatEntry = {
  id: string;
  role: ChatRole;
  content: string;
  payload?: ChatApiResponse;
};

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function HomePage() {
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendQuestion = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatEntry = {
      id: newId(),
      role: "user",
      content: trimmed,
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      const data = (await res.json()) as ChatApiResponse;
      const assistantMsg: ChatEntry = {
        id: newId(),
        role: "assistant",
        content: data.matched
          ? "등록된 데이터에서 관련 안내를 찾았습니다."
          : data.fallbackMessage ?? "일치하는 안내를 찾지 못했습니다.",
        payload: data,
      };
      setMessages((m) => [...m, assistantMsg]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: newId(),
          role: "assistant",
          content: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
          payload: {
            ok: false,
            matched: false,
            fallbackMessage:
              "네트워크 오류로 응답을 가져오지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.",
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-8">
      <header className="mb-6 border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          주택임대차보호법 질의 안내
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          이 서비스는 생성형 AI(LLM)를 사용하지 않습니다. 제공된 JSON 데이터와 규칙 기반 매칭만으로
          답변을 구성합니다. 실제 사실관계에 따라 달라질 수 있으며 법률 자문이 아닙니다.
        </p>
      </header>

      <ExampleChips
        disabled={loading}
        onPick={(q) => void sendQuestion(q)}
      />

      <div className="mt-6 flex flex-1 flex-col gap-3">
        {messages.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-200 bg-white/80 px-4 py-8 text-center text-sm text-slate-500">
            아래 입력창에 질문을 입력하거나 예시 질문을 눌러 보세요.
          </p>
        )}
        {messages.map((msg) =>
          msg.role === "user" ? (
            <ChatMessage key={msg.id} role="user" content={msg.content} />
          ) : (
            <div key={msg.id} className="space-y-2">
              <ChatMessage role="assistant" content={msg.content} />
              {msg.payload ? (
                <AnswerCard response={msg.payload} onRelatedClick={(q) => void sendQuestion(q)} />
              ) : null}
            </div>
          ),
        )}
        {loading && (
          <p className="text-sm text-slate-500" aria-live="polite">
            검색 중…
          </p>
        )}
      </div>

      <form
        className="sticky bottom-0 mt-6 flex gap-2 border-t border-slate-200 bg-[var(--background)] pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          void sendQuestion(input);
        }}
      >
        <label htmlFor="q" className="sr-only">
          질문 입력
        </label>
        <input
          id="q"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="예: 계약갱신청구권이 뭐예요?"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-slate-400 focus:ring-2"
          disabled={loading}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          보내기
        </button>
      </form>
    </main>
  );
}
