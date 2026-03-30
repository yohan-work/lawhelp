import { readFile } from "fs/promises";
import path from "path";
import { lawGuideDatasetSchema } from "./schemas";
import type { LawGuideDataset } from "@/types/guide";

const DEFAULT_PATH = path.join(process.cwd(), "data", "guide", "housing-rental-guide.json");

let cache: LawGuideDataset | null = null;

export async function loadLawGuide(pathOverride?: string): Promise<LawGuideDataset> {
  if (cache && !pathOverride) return cache;

  const p = pathOverride ?? DEFAULT_PATH;
  const raw = await readFile(p, "utf-8");
  const data: LawGuideDataset = lawGuideDatasetSchema.parse(JSON.parse(raw));

  if (!pathOverride) cache = data;
  return data;
}

export function clearLawGuideCache() {
  cache = null;
}
