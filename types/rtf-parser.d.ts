declare module "rtf-parser" {
  type RtfSpan = { value: string };
  type RtfParagraph = { content: RtfSpan[] };
  type RtfDocument = { content: RtfParagraph[] };

  function parseString(str: string, cb: (err: Error | null, doc: RtfDocument) => void): void;

  interface RtfParser {
    (cb: (err: Error | null, doc: RtfDocument) => void): NodeJS.WritableStream;
    string(str: string, cb: (err: Error | null, doc: RtfDocument) => void): void;
    stream(
      stream: NodeJS.ReadableStream,
      cb: (err: Error | null, doc: RtfDocument) => void,
    ): void;
  }

  const parse: RtfParser;
  export = parse;
}
