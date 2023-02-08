export type PackageManager = "npm" | "yarn" | "pnpm";

export interface Config {
  enable: boolean;
  debug: boolean;
  decorator: "both" | "minified" | "compressed";
  sizeColor: "minified" | "compressed";

  colors: ColorsConfig;
  sizes: SizesConfig;
  extensions: ExtensionsConfig;

  // Just like the directives - but if you want to add multiple very easily.
  externals: string[];
  skip: string[];
  defaultPlatform: "browser" | "node";
  platform: Record<string, "browser" | "node">;
  defaultFormat: "cjs" | "esm";
  format: "cjs" | "esm";

  fallback: PackageManager;

  packageManager: "npm" | "yarn" | "pnpm" | "auto";
}

export interface ColorsConfig {
  small: ColorsObject;
  medium: ColorsObject;
  large: ColorsObject;
  extreme: ColorsObject;
}

export interface ColorsObject {
  dark: string;
  light: string;
}

export interface SizesConfig {
  small: number;
  medium: number;
  large: number;
}

export interface ExtensionsConfig {
  typescript: string[];
  javascript: string[];
  vue: string[];
  svelte: string[];
  astro: string[];
}
