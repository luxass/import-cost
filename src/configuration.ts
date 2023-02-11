import { ConfigurationTarget, workspace } from "vscode";
import type { ConfigurationScope } from "vscode";

import type { Config } from "./types";

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
