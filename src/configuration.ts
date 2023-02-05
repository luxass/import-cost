import { ConfigurationTarget, workspace } from "vscode";
import type { ConfigurationScope } from "vscode";

export interface Config {
  enable: boolean;
  debug: boolean;
  decorator: "both" | "minfied" | "compressed";
  colors: ColorsConfig;
  sizes: SizesConfig;
  extensions: ExtensionsConfig;
  
  // Just like the directives - but if you want to add multiple very easily.
  externals: string[];
  browser: string[];
  skip: string[];

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

export const config = {
  get<T extends Path<Config>>(key: T, options?: {
    scope?: ConfigurationScope;
    defaultValue?: PathValue<Config, T>;
    section: string;
  }): PathValue<Config, T> {
    const section = options?.section ?? "import-cost";
    const defaultValue = options?.defaultValue;
    const scope = options?.scope;
    
    const value = !defaultValue ?
      workspace
        .getConfiguration(section, scope)
        .get<PathValue<Config, T>>(key)! :
      workspace
        .getConfiguration(section, scope)
        .get<PathValue<Config, T>>(key, defaultValue)!;

    return value;
  },

  set<T extends Path<Config>>(
    key: T,
    value: PathValue<Config, T>,
    target: ConfigurationTarget = ConfigurationTarget.Global
  ): Thenable<void> {
    return workspace.getConfiguration("import-cost").update(key, value, target);
  }
};

type SubPath<T, Key extends keyof T> = Key extends string
  ? T[Key] extends Record<string, any>
    ?
      | `${Key}.${SubPath<T[Key], Exclude<keyof T[Key], keyof any[]>> &
      string}`
      | `${Key}.${Exclude<keyof T[Key], keyof any[]> & string}`
    : never
  : never;

type Path<T> = SubPath<T, keyof T> | keyof T;

type PathValue<T, P extends Path<T>> = P extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? Rest extends Path<T[Key]>
      ? PathValue<T[Key], Rest>
      : never
    : never
  : P extends keyof T
    ? T[P]
    : never;
