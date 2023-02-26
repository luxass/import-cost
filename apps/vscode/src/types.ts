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
  platform: Platform;
  platforms: Record<string, Platform>;
  format: Format;
  formats: Record<string, Format>;
  plugins: string[];
}

export interface ColorsObject {
  dark: string;
  light: string;
}
