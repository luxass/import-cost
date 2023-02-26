import { Message } from "esbuild";
import { cache } from "./cache";

import type { Import } from "./parser";

export interface CalculateAllOptions {
  /**
   * The path to the esbuild binary.
   */
  esbuildBinary?: string;

  /**
   * An array of dependencies to exclude from the calculation.
   */
  externals: string[];

  /**
   * The current working directory.
   */
  cwd: URL;
}

export async function calculateAll(
  parsedImports: Import[],
  options: CalculateAllOptions
): Promise<any> {
  for await (const result of parsedImports.map((parsedImport) =>
    calculate(parsedImport, options)
  )) {
    console.log(result);
  }
}

export interface CalculateOptions {
  esbuildBinary?: string;
}

export interface CalculateResult {
  errors: Message[];
  warnings: Message[];
  pkg: Import & {
    size: {
      bytes: number;
      gzip: number;
    };
  };
}

export async function calculate(
  parsedImport: Import,
  options: CalculateOptions
): Promise<CalculateResult> {
  try {
    const cacheKey = `${parsedImport.name}:${parsedImport.version}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey) as CalculateResult;
    }

    const { build }: typeof import("esbuild-wasm") = await import(
      options.esbuildBinary ?? "esbuild-wasm"
    );
  } catch (e) {
    return {
      errors: e.errors,
      warnings: e.warnings,
      pkg: {
        ...parsedImport,
        size: {
          bytes: 0,
          gzip: 0
        }
      }
    };
  }
}
