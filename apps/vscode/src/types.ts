import type { Format, Platform } from "esbuild";

export type PackageManager = "npm" | "yarn" | "pnpm";

export interface Config {
  enable: boolean;
  decorator: "both" | "minified" | "compressed";
  sizeColor: "minified" | "compressed";

  colors: {
    small: ColorsObject;
    medium: ColorsObject;
    large: ColorsObject;
    extreme: ColorsObject;
  };
  sizes: {
    small: number;
    medium: number;
    large: number;
  };
  // Just like the directives - but if you want to add multiple very easily.
  externals: string[];
  skip: string[];
  defaultPlatform: Platform;
  platform: Record<string, Platform>;
  defaultFormat: Format;
  format: Record<string, Format>;

  fallback: PackageManager;

  // From npm extensions (vscode builtin)
  packageManager: "npm" | "yarn" | "pnpm" | "auto";
}

export interface ColorsObject {
  dark: string;
  light: string;
}
