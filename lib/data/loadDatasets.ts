import { readFile } from "fs/promises";
import path from "path";
import {
  lawSourceDatasetSchema,
  responseDatasetSchema,
  synonymDictionarySchema,
  topicMapSchema,
} from "./schemas";
import type { LoadedDatasets } from "@/types/api";

const DATA_DIR = path.join(process.cwd(), "data");

let cache: LoadedDatasets | null = null;

export async function loadDatasets(): Promise<LoadedDatasets> {
  if (cache) return cache;

  const [sourceRaw, responseRaw, synRaw, topicRaw] = await Promise.all([
    readFile(path.join(DATA_DIR, "source", "housing-rental-protection.json"), "utf-8"),
    readFile(path.join(DATA_DIR, "response", "intents.json"), "utf-8"),
    readFile(path.join(DATA_DIR, "dictionaries", "synonym-dictionary.json"), "utf-8"),
    readFile(path.join(DATA_DIR, "dictionaries", "topic-map.json"), "utf-8"),
  ]);

  const source = lawSourceDatasetSchema.parse(JSON.parse(sourceRaw));
  const response = responseDatasetSchema.parse(JSON.parse(responseRaw));
  const synonyms = synonymDictionarySchema.parse(JSON.parse(synRaw));
  const topicMap = topicMapSchema.parse(JSON.parse(topicRaw));

  if (source.lawId !== response.lawId) {
    throw new Error("source.lawId and response.lawId must match");
  }

  cache = { source, response, synonyms, topicMap };
  return cache;
}

/** 테스트용 캐시 초기화 */
export function clearDatasetCache() {
  cache = null;
}
