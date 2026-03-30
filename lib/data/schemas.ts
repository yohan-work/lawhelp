import { z } from "zod";

export const lawArticleSchema = z.object({
  articleNo: z.string(),
  title: z.string().optional(),
  fullText: z.string(),
  clauses: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  relatedArticleNos: z.array(z.string()).optional(),
});

export const lawSourceDatasetSchema = z.object({
  lawId: z.string(),
  lawName: z.string(),
  effectiveDate: z.string().optional(),
  sourceUrl: z.string().optional(),
  articles: z.array(lawArticleSchema),
});

export const intentSourceRefSchema = z.object({
  articleNo: z.string(),
  excerpt: z.string().optional(),
});

export const responseIntentSchema = z.object({
  intentId: z.string(),
  title: z.string(),
  intentPatterns: z.array(z.string()),
  keywords: z.array(z.string()),
  synonyms: z.array(z.string()),
  answerSummary: z.string(),
  answerDetail: z.string(),
  answerPrefix: z.string().optional(),
  disclaimer: z.string().optional(),
  cautions: z.array(z.string()),
  relatedArticleNos: z.array(z.string()),
  sourceRefs: z.array(intentSourceRefSchema).optional(),
});

export const responseDatasetSchema = z.object({
  lawId: z.string(),
  fallbackMessage: z.string(),
  fallbackExamples: z.array(z.string()),
  intents: z.array(responseIntentSchema),
});

export const synonymDictionarySchema = z.object({
  entries: z.array(
    z.object({
      from: z.array(z.string()),
      to: z.string(),
    }),
  ),
});

export const topicMapSchema = z.object({
  topics: z.record(z.array(z.string())),
});
