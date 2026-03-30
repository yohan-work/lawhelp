/**
 * 법령 평문에서 조문 헤더 인식 — 줄 단위(데이터셋 분리) / 전역 검색(워드 파싱)
 * `제N조(제목)` · `제N조의M(제목)` 모두 지원 (국가법령정보센터 평문 형식)
 */

const HEAD_CORE = String.raw`제\s*(\d+)\s*조(?:의(\d+))?(?:\(([^)]*)\))?`;

/** `제3조의2` → articleNo `3의2` */
export function articleNoFromHeadGroups(main: string, sub?: string): string {
  return sub ? `${main}의${sub}` : main;
}

/** 줄 시작이 `제N조(제목)?` 또는 `제N조의M(제목)?` */
export function matchLineArticleHead(line: string): { articleNo: string; title?: string } | null {
  const re = new RegExp(`^\\s*${HEAD_CORE}`);
  const m = line.match(re);
  if (!m) return null;
  return {
    articleNo: articleNoFromHeadGroups(m[1], m[2]),
    title: m[3]?.trim() || undefined,
  };
}

/** `\b`는 한글 끝에서 기대대로 동작하지 않을 수 있어 접두만 검사 */
export function isAppendixLine(line: string): boolean {
  return /^\s*부칙/.test(line);
}

/** 워드 추출본 등 — matchAll 용 (lastIndex 이슈 방지: 호출부에서 매번 새 인스턴스) */
export function articleHeadGlobalRegex() {
  return new RegExp(HEAD_CORE, "g");
}
