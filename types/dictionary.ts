export type SynonymEntry = {
  from: string[];
  to: string;
};

export type SynonymDictionary = {
  entries: SynonymEntry[];
};

export type TopicMap = {
  topics: Record<string, string[]>;
};
