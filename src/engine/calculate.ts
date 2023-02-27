import { dirname } from "node:path";

import type { BuildOptions, Message } from "esbuild";

import { gzip } from "pako";
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

export interface CalculateAllResult {
  errors: Message[];
  warnings: Message[];
  calculations: CalculateResult[];
}

export async function calculateAll(
  parsedImports: Import[],
  options: CalculateAllOptions
): Promise<CalculateAllResult> {
  const warnings: Message[] = [];
  const errors: Message[] = [];
  const calculations: any[] = [];
  for await (const result of parsedImports.map((parsedImport) =>
    calculate(parsedImport, options)
  )) {
    console.log(result);
    
    result.errors = result.errors.concat(result.errors);
    result.warnings = result.warnings.concat(result.warnings);
    
    calculations.push({
      name: result.pkg.name,
      line: result.pkg.line,
      path: result.pkg.fileName,
      size: result.pkg.size
    });
  }

  return {
    errors,
    warnings,
    calculations
  };
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

    const pkg = {
      ...parsedImport,
      size: {
        bytes: size,
        gzip: gzipSize
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
          bytes: 0,
          gzip: 0
        }
      }
    };
  }
}
