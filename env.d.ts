/// <reference types="vite/client" />

declare module "*?worker&url" {
  const url: string;
  export default url;
}

declare namespace Intl {
  interface SegmenterOptions {
    localeMatcher?: "best fit" | "lookup";
    granularity?: "grapheme" | "word" | "sentence";
  }

  class Segmenter {
    constructor(locales?: string | string[], options?: SegmenterOptions);
    segment(input: string): Iterable<{ segment: string; index: number; input: string }>;
  }
}
