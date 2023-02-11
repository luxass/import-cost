import { gzip } from "env:gzip";
import { dirname } from "env:path";
import type { BuildOptions } from "esbuild";

import { log } from "../logger";
import { cache } from "./caching";
import type {
  CalculateSizeOptions,
  CalculateSizeResult,
  ParsedImport
} from "./types";

export async function calculateSize(
  parsedImport: ParsedImport,
  options?: CalculateSizeOptions
): Promise<CalculateSizeResult> {
  try {
    const cacheKey = `${parsedImport.name}:${parsedImport.version}`;
    if (cache.has(cacheKey)) {
      log.info(`Using cached size for ${cacheKey}...`);
      // This can't be undefined, because we check if it's in the cache.
      return cache.get(cacheKey) as CalculateSizeResult;
    }
    log.info(`Calculating size for ${cacheKey}...`);

    const { build }: typeof import("esbuild") = await import(
      options?.esbuild ?? "esbuild"
    );

    const directives = parsedImport.directives;

    const platform = directives?.platform || "node";
    const format = directives?.format || "esm";
    log.info(
      `Building ${parsedImport.name} for platform-${platform} and format-${format}...`
    );

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
      external: options?.externals || [],
      outdir: "dist",
      minify: true
    } satisfies BuildOptions);

    let size = 0;
    let gzipSize = 0;
    if (outputFiles.length > 0) {
      size = outputFiles[0].contents.byteLength;
      gzipSize = await gzip(outputFiles[0].text, {
        level: 9
      }).then(({ length }) => length);
    }

    const result = {
      errors,
      warnings,
      pkg: {
        ...parsedImport,
        size,
        gzip: gzipSize
      }
    };

    cache.set(cacheKey, result);

    return result;
  } catch (e) {
    log.error(e);
    return {
      errors: e.errors,
      warnings: e.warnings,
      pkg: {
        ...parsedImport,
        size: 0,
        gzip: 0
      }
    };
  }
}
