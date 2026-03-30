import type { SynonymDictionary, TopicMap } from "./dictionary";
import type { ResponseDataset, ResponseIntent } from "./response";
import type { LawSourceDataset } from "./source";

export type MatchedArticleSnippet = {
  articleNo: string;
  title?: string;
  fullText: string;
  easyInterpretation?: string;
};

export type ChatApiResponse = {
  ok: boolean;
  matched: boolean;
  score?: number;
  intent?: ResponseIntent;
  articles?: MatchedArticleSnippet[];
  relatedQuestions?: { intentId: string; title: string }[];
  answerSummary?: string;
  answerDetail?: string;
  answerPrefix?: string;
  disclaimer?: string;
  cautions?: string[];
  sourceUrl?: string;
  fallbackMessage?: string;
  fallbackExamples?: string[];
};

export type LoadedDatasets = {
  source: LawSourceDataset;
  response: ResponseDataset;
  synonyms: SynonymDictionary;
  topicMap: TopicMap;
};
