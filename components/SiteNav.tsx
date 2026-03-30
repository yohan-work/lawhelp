import Link from "next/link";

export function SiteNav() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm">
      <nav
        className="mx-auto flex max-w-2xl flex-wrap items-center gap-3 px-4 py-3 text-sm"
        aria-label="주요 메뉴"
      >
        <Link href="/" className="font-semibold text-slate-900 hover:text-slate-700">
          홈
        </Link>
        <span className="text-slate-300" aria-hidden>
          |
        </span>
        <Link href="/articles" className="text-slate-600 hover:text-slate-900">
          조항 목록
        </Link>
        <span className="text-slate-300" aria-hidden>
          |
        </span>
        <Link href="/guide" className="text-slate-600 hover:text-slate-900">
          쉬운 해설
        </Link>
      </nav>
    </header>
  );
}
