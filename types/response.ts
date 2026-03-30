export type IntentSourceRef = {
  articleNo: string;
  excerpt?: string;
};

export type ResponseIntent = {
  intentId: string;
  title: string;
  intentPatterns: string[];
  keywords: string[];
  synonyms: string[];
  answerSummary: string;
  answerDetail: string;
  answerPrefix?: string;
  disclaimer?: string;
  cautions: string[];
  relatedArticleNos: string[];
  sourceRefs?: IntentSourceRef[];
};

export type ResponseDataset = {
  lawId: string;
  fallbackMessage: string;
  fallbackExamples: string[];
  intents: ResponseIntent[];
};
