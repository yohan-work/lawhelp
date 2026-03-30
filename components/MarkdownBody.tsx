import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-8 border-b border-slate-200 pb-2 text-lg font-semibold text-slate-900 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-6 text-base font-semibold text-slate-800">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="mb-4 text-sm leading-relaxed text-slate-700 last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-4 list-inside list-disc space-y-1 text-sm text-slate-700">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-4 list-inside list-decimal space-y-1 text-sm text-slate-700">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  hr: () => <hr className="my-8 border-slate-200" />,
  strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-medium text-slate-800 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-500"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-4 border-l-4 border-slate-300 pl-4 text-sm text-slate-600">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="mb-6 w-full overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[280px] border-collapse text-left text-sm text-slate-800">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-slate-50">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-slate-200">{children}</tbody>,
  tr: ({ children }) => <tr className="align-top">{children}</tr>,
  th: ({ children }) => (
    <th className="border-b border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2.5 text-sm leading-relaxed text-slate-700 [&:first-child]:w-24 [&:first-child]:shrink-0 [&:first-child]:font-medium [&:first-child]:text-slate-600">
      {children}
    </td>
  ),
};

type Props = {
  content: string;
};

export function MarkdownBody({ content }: Props) {
  return (
    <div className="markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
