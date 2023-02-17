import type { BuildOptions, Format, Message, Platform } from "esbuild";

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

export interface Options {
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
  externals: string[];

  /**
   * Skip these imports.
   */
  skips: string[];

  /**
   * Default format for the build.
   * @default "esm"
   */
  format?: Format;

  /**
   * Default platform for the build.
   * @default "node"
   */
  platform?: Platform;

  /**
   * Set each package format
   *
   * This allows you to set the format for each package. So you
   * don't have to set the format for each import in each file.
   */
  formats?: Record<string, Format>;

  /**
   * Set each package platform
   *
   * This allows you to set the platform for each package. So you
   * don't have to set the platform for each import in each file.
   */
  platforms?: Record<string, Platform>;

  /**
   * The current working directory to resolve the package.json from.
   * Only used when external is not provided.
   */
  cwd: URL;

  /**
   * The path to the esbuild binary.
   *
   * @default "esbuild"
   */
  esbuild?: string;
}

export interface ImportSize {
  size: {
    bytes: number;
    gzip: number;
  };
  line: number;
  path: string;
  name: string;
}

export interface CostResult {
  packages: ImportSize[];
  warnings: Message[];
  errors: Message[];
}

/**
 * The directives that can be used on a import statement.
 */
export interface ImportDirectives {
  external?: boolean;
  platform?: NonNullable<BuildOptions["platform"]>;
  skip?: boolean;
  format?: NonNullable<BuildOptions["format"]>;
}

export interface ParsedImport {
  fileName: string;
  name: string;
  line: number;
  code: string;
  version?: string;
  directives: ImportDirectives;
}

export interface CalculateSizeOptions {
  /**
   * The format to bundle the code in.
   */
  format?: Format;

  /**
   * The platform to bundle the code for.
   */
  platform?: Platform;

  /**
   * An array of dependencies to exclude from the calculation.
   */
  externals: string[];

  /**
   * The path to the esbuild binary.
   */
  esbuild?: string;
}

export interface CalculateSizeResult {
  errors: Message[];
  warnings: Message[];
  // TODO: This type should probably be changed
  pkg: ParsedImport & {
    size: number;
    gzip: number;
  };
}

export interface Logger {
  info: (...args: any[]) => void;
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
}

export interface Import {
  fileName: string;
  name: string;
  line: number;
  code: string;
  version?: string;
  directives: ImportDirectives;
}


export interface CalculateOptions {
  /**
   * Parsed Imports
   */
  imports: Import[];

  /**
   * Logger
   *
   * Used by the VSCode extension to log to the output channel.
   */
  log: Logger;
}

export interface ParseImportsOptions {
  fileName: string;
  content: string;
  language: Language;
  skips?: string[];
  formats?: Record<string, Format>;
  platforms?: Record<string, Platform>;
}