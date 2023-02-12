export type PackageManager = "npm" | "yarn" | "pnpm";

export interface Config {
  enable: boolean;
  debug: boolean;
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
  defaultPlatform: "browser" | "node";
  platform: Record<string, "browser" | "node">;
  defaultFormat: "cjs" | "esm";
  format: Record<string, "cjs" | "esm">;

  fallback: PackageManager;

  // From npm extensions (vscode builtin)
  packageManager: "npm" | "yarn" | "pnpm" | "auto";
}

export interface ColorsObject {
  dark: string;
  light: string;
}
