/** `/guide` 페이지용 — 워드 파싱·수동 편집 후 `data/guide/*.json`에 둠 */

export type GuideLine = {
  fullText: string;
  easyInterpretation: string;
};

export type GuideArticle = {
  articleNo: string;
  title?: string;
  lines: GuideLine[];
  /** 검수용; UI에서는 숨김 */
  parseWarnings?: string[];
};

export type LawGuideDataset = {
  lawId: string;
  lawName: string;
  effectiveDate?: string;
  sourceUrl?: string;
  /** 페이지 상단 안내 */
  disclaimer: string;
  preamble?: string;
  articles: GuideArticle[];
};
