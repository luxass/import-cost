import type { Message } from "esbuild";

import type { defaultLog } from "./log";

interface SharedOptions {
  /**
   * Log the result to the console.
   */
  log?: typeof defaultLog;
}

export type Language =
  | "javascript"
  | "js"
  | "javascriptreact"
  | "jsx"
  | "typescript"
  | "ts"
  | "typescriptreact"
  | "tsx"
  | "vue"
  | "vue-ts"
  | "svelte"
  | "svelte-ts"
  | "astro";

export interface Options extends SharedOptions {
  /**
   * The path to the file to calculate the cost of.
   */
  path: string;

  /**
   * The code to calculate the cost of.
   */
  code: string;

  /**
   * The language of the code.
   */
  language: Language;

  /**
   * An array of dependencies to exclude from the calculation.
   */
  externals: Array<string>;

  /**
   * The current working directory to resolve the package.json from.
   * Only used when external is not provided.
   *
   * @default process.cwd()
   */
  cwd?: string;

  /**
   * The path to the esbuild binary.
   *
   * @default "esbuild"
   */
  esbuild?: string;
}

export interface ImportSize {
  size: Record<"gzip" | "bundle", number>;
  line: string;
  path: string;
  name: string;
}

export interface CostResult {
  imports: Array<ImportSize>;
  warnings: Array<Message>;
  errors: Array<Message>;
}

export interface ImportDirectives {
  external?: boolean;
  platform?: "browser" | "node";
}

export interface ParsedImport {
  fileName: string;
  name: string;
  line: number;
  code: string;
  version?: string;
  directives: ImportDirectives;
}

export interface CalculateSizeOptions extends SharedOptions {
  /**
   * The format to bundle the code in.
   */
  format: "cjs" | "esm";

  /**
   * An array of dependencies to exclude from the calculation.
   */
  externals: Array<string>;

  /**
   * The path to the esbuild binary.
   */
  esbuild?: string;
}

export interface CalculateSizeResult {
  errors: Array<Message>;
  warnings: Array<Message>;
  pkg: ParsedImport & {
    size: number;
    gzip: number;
  };
}
