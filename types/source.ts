export type LawArticle = {
  articleNo: string;
  title?: string;
  fullText: string;
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
