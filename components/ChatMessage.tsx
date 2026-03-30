type Props = {
  role: "user" | "assistant";
  content: string;
};

export function ChatMessage({ role, content }: Props) {
  const isUser = role === "user";
  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      role="article"
      aria-label={isUser ? "사용자 메시지" : "안내 응답"}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
          isUser
            ? "bg-slate-800 text-white"
            : "border border-slate-200 bg-white text-slate-800 shadow-sm"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
