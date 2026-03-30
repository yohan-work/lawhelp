/** `3의2` → `제3조의2` (법령 표기) */
function formatArticleNoLabel(articleNo: string): string {
  const m = articleNo.match(/^(\d+)의(\d+)$/);
  if (m) return `제${m[1]}조의${m[2]}`;
  return `제${articleNo}조`;
}

/** 조문 번호·제목을 목록·카드 제목으로 */
export function formatArticleHeading(articleNo: string, title?: string): string {
  if (articleNo === "부칙") {
    return "부칙";
  }
  return `${formatArticleNoLabel(articleNo)}${title ? ` (${title})` : ""}`;
}

export function formatRelatedArticleRef(no: string): string {
  if (no === "부칙") return "부칙";
  return formatArticleNoLabel(no);
}
