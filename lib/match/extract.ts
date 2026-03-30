export type QueryHints = {
  percents: number[];
  numbers: number[];
};

export function extractHints(text: string): QueryHints {
  const percents: number[] = [];
  const numbers: number[] = [];

  const percentRe = /(\d+(?:\.\d+)?)\s*%/g;
  let m: RegExpExecArray | null;
  while ((m = percentRe.exec(text)) !== null) {
    percents.push(Number(m[1]));
  }

  const numRe = /\d+(?:\.\d+)?/g;
  while ((m = numRe.exec(text)) !== null) {
    numbers.push(Number(m[0]));
  }

  return { percents, numbers };
}
