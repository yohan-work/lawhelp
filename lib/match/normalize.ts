/** 한국어 질문용 단순 정규화: 공백·구두점·토큰 끝 조사 일부 제거 */

const PUNCT = /[.,!?~'"“”‘’()[\]{}:;·…]/g;

const TRAILING_PARTICLE = /(은|는|이|가|을|를|에|의|로|으로|와|과|도|만|에서|에게|한테|까지|부터|보다)$/u;

function stripTokenParticles(token: string): string {
  let t = token;
  for (let i = 0; i < 3; i++) {
    const next = t.replace(TRAILING_PARTICLE, "");
    if (next === t) break;
    t = next;
  }
  return t;
}

export function normalizeQuestion(input: string): string {
  let s = input.trim().toLowerCase();
  s = s.replace(PUNCT, " ");
  s = s.replace(/\s+/g, " ");
  const tokens = s.split(" ").filter(Boolean).map(stripTokenParticles);
  return tokens.join(" ").trim();
}

export function applySynonyms(text: string, map: Map<string, string>): string {
  let out = text;
  for (const [from, to] of map) {
    if (from.length >= 2 && out.includes(from)) {
      out = out.split(from).join(to);
    }
  }
  return out.replace(/\s+/g, " ").trim();
}

/** synonym dictionary → 치환용 맵 (긴 from 우선 적용 위해 정렬 가능) */
export function buildSynonymReplaceMap(
  entries: { from: string[]; to: string }[],
): Map<string, string> {
  const pairs: { from: string; to: string }[] = [];
  for (const e of entries) {
    for (const f of e.from) {
      const t = f.trim().toLowerCase();
      if (t.length) pairs.push({ from: t, to: e.to.toLowerCase() });
    }
  }
  pairs.sort((a, b) => b.from.length - a.from.length);
  return new Map(pairs.map((p) => [p.from, p.to]));
}
