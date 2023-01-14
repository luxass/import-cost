export type Language =
  | "javascript"
  | "js"
  | "typescript"
  | "ts"
  | "vue"
  | "javascriptreact"
  | "jsx"
  | "typescriptreact"
  | "tsx"
  | "svelte"
  | "astro";

export interface Options {
  path: string;
  code: string;
  language: Language;
  external: string[];
}

export interface ImportSize {
  size: Record<"gzip" | "bundle", number>;
  line: string;
  path: string;
  name: string;
}

export interface CostResult {
  imports: ImportSize[];
}
