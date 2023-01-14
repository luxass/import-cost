export type Language =
  | "javascript"
  | "js"
  | "typescript"
  | "ts"
  | "vue"
  | "jsx"
  | "tsx"
  | "svelte"
  | "astro";

export interface Options {
  path: string;
  code: string;
  language: Language;
  external: string[];
}

export interface ImportSize {}

export interface CostResult {
  imports: ImportSize[];
}

export interface Package {}
