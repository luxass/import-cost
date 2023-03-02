import { dirname } from "node:path";

import type { BuildOptions, Message } from "esbuild";
import { filesize } from "filesize";
import { gzip } from "pako";
import type { Uri } from "vscode";

import { log } from "../log";
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
  cwd: Uri;
}

export async function calculateAll(
  parsedImports: Import[],
  options: CalculateAllOptions
): Promise<CalculateResult[]> {
  const results = await Promise.all<CalculateResult>(
    parsedImports.map(async (parsedImport) => {
      const cacheKey = `${parsedImport.name}:${parsedImport.version}`;
      const cachedResult = cache.get(cacheKey);
      if (cachedResult) {
        log.info("Using cached result for", cacheKey);
        return cachedResult;
      }
      const result = await calculate(parsedImport, options);
      cache.set(cacheKey, result);

      return result;
    })
  );

  return results;
}

export interface CalculateOptions {
  esbuildBinary?: string;
}

export type ImportResult = {
  size: {
    minified: number;
    minifiedFormatted: string;
    gzip: number;
    gzipFormatted: string;
  };
} & Import;

export interface CalculateResult {
  errors: Message[];
  warnings: Message[];
  pkg: ImportResult;
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

    const directives = parsedImport.directives;
    const platform = directives.platform || "node";
    const format = directives.format || "esm";
    // platform = directives.platform || platform || "node";
    // format = directives.format || format || "esm";
    // log.info(
    //   `Building ${parsedImport.name} for platform-${platform} and format-${format}...`
    // );

    const { errors, warnings, outputFiles } = await build({
      stdin: {
        contents: parsedImport.code,
        resolveDir: dirname(parsedImport.fileName),
        sourcefile: parsedImport.fileName
      },
      bundle: true,
      format,
      platform,
      write: false,
      // external: externals || [],
      external: [],
      outdir: "dist",
      minify: true,
      mainFields:
        platform === "browser" ?
            ["browser", "module", "main"] :
            ["module", "main"],
      legalComments: "none"
    } satisfies BuildOptions);

    let size = 0;
    let gzipSize = 0;
    if (outputFiles.length > 0) {
      size = outputFiles[0].contents.byteLength;
      const result = await gzip(outputFiles[0].text, {
        level: 9
      });

      gzipSize = result.byteLength;
    }

    const pkg: CalculateResult["pkg"] = {
      ...parsedImport,
      size: {
        minified: size,
        minifiedFormatted: filesize(size, {
          base: 2,
          standard: "jedec"
        }) as string,
        gzip: gzipSize,
        gzipFormatted: filesize(gzipSize, {
          base: 2,
          standard: "jedec"
        }) as string
      }
    };

    cache.set(cacheKey, pkg);

    return {
      errors,
      warnings,
      pkg
    };
  } catch (e) {
    return {
      errors: e.errors,
      warnings: e.warnings,
      pkg: {
        ...parsedImport,
        size: {
          minified: 0,
          minifiedFormatted: "0 B",
          gzip: 0,
          gzipFormatted: "0 B"
        }
      }
    };
  }
}
