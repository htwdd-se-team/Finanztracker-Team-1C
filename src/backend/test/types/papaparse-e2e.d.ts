// Type declaration for papaparse in e2e tests
// papaparse is available at runtime via pnpm, we just need TypeScript to recognize it
declare module "papaparse" {
  export interface ParseResult<T = any> {
    data: T[];
    errors: ParseError[];
    meta: ParseMeta;
  }

  export interface ParseError {
    type: string;
    code: string;
    message: string;
    row?: number;
  }

  export interface ParseMeta {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    fields?: string[];
    truncated: boolean;
  }

  export interface ParseConfig<T = any> {
    delimiter?: string;
    newline?: string;
    quoteChar?: string;
    escapeChar?: string;
    header?: boolean;
    transformHeader?: (header: string) => string;
    transform?: (value: string) => string;
    dynamicTyping?: boolean;
    preview?: number;
    encoding?: string;
    worker?: boolean;
    comments?: boolean | string;
    step?: (results: ParseResult<T>, parser: any) => void;
    complete?: (results: ParseResult<T>) => void;
    skipEmptyLines?: boolean;
    fastMode?: boolean;
    beforeFirstChunk?: (chunk: string) => string | void;
    withCredentials?: boolean;
  }

  export function parse<T = any>(
    input: string | File,
    config?: ParseConfig<T>,
  ): ParseResult<T>;
}

