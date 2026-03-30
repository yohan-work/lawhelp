export type LawArticle = {
  articleNo: string;
  title?: string;
  fullText: string;
  /** 워드 등에서 기록한 일반인용 쉬운 해석(선택) */
  easyInterpretation?: string;
  clauses?: string[];
  keywords?: string[];
  relatedArticleNos?: string[];
};

export type LawSourceDataset = {
  lawId: string;
  lawName: string;
  effectiveDate?: string;
  sourceUrl?: string;
  articles: LawArticle[];
};
