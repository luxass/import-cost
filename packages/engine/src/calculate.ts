import type { Message } from "esbuild";

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
    // result.errors = result.errors.concat(result.errors);
    // result.warnings = result.warnings.concat(result.warnings);
    // packages.push({
    //   name: result.pkg.name,
    //   line: result.pkg.line,
    //   path: result.pkg.fileName,
    //   size: {
    //     bytes: result.pkg.size,
    //     gzip: result.pkg.gzip
    //   }
    // });
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

    // const directives = parsedImport.directives;

    // platform = directives.platform || platform || "node";
    // format = directives.format || format || "esm";
    // log.info(
    //   `Building ${parsedImport.name} for platform-${platform} and format-${format}...`
    // );

    // const { errors, warnings, outputFiles } = await build({
    //   stdin: {
    //     contents: parsedImport.code,
    //     resolveDir: dirname(parsedImport.fileName),
    //     sourcefile: parsedImport.fileName
    //   },
    //   bundle: true,
    //   format,
    //   platform,
    //   write: false,
    //   external: externals || [],
    //   outdir: "dist",
    //   minify: true,
    //   mainFields:
    //     platform === "browser" ?
    //         ["browser", "module", "main"] :
    //         ["module", "main"],
    //   legalComments: "none"
    // } satisfies BuildOptions);

    // let size = 0;
    // let gzipSize = 0;
    // if (outputFiles.length > 0) {
    //   size = outputFiles[0].contents.byteLength;
    //   const result = await gzip(outputFiles[0].text, {
    //     level: 9
    //   });

    //   gzipSize = result.byteLength;
    // }

    // const result = {
    //   errors,
    //   warnings,
    //   pkg: {
    //     ...parsedImport,
    //     size,
    //     gzip: gzipSize
    //   }
    // };

    // cache.set(cacheKey, result);

    // return result;
    return {
      errors: [],
      warnings: [],
      pkg: {
        ...parsedImport,
        size: {
          bytes: 0,
          gzip: 0
        }
      }
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
