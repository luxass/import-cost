import type { Format, Platform } from "esbuild";
import { ConfigurationTarget, workspace } from "vscode";
import type { ConfigurationScope } from "vscode";

import type { ParserPlugin } from "@babel/parser";

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
  plugins: ParserPlugin[];
}

export interface ColorsObject {
  dark: string;
  light: string;
}

export const config = {
  get<T extends Path<Config>>(
    key: T,
    options?: {
      scope?: ConfigurationScope;
      defaultValue?: PathValue<Config, T>;
      section: string;
    }
  ): PathValue<Config, T> {
    const section = options?.section ?? "importCost";
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
    return workspace.getConfiguration("importCost").update(key, value, target);
  }
};

type ChildPath<T, Key extends keyof T> = Key extends string
  ? T[Key] extends Record<string, any>
    ?
      | `${Key}.${ChildPath<T[Key], Exclude<keyof T[Key], keyof any[]>> &
      string}`
      | `${Key}.${Exclude<keyof T[Key], keyof any[]> & string}`
    : never
  : never;

type Path<T> = ChildPath<T, keyof T> | keyof T;

type PathValue<T, P extends Path<T>> = P extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? Rest extends Path<T[Key]>
      ? PathValue<T[Key], Rest>
      : never
    : never
  : P extends keyof T
    ? T[P]
    : never;
