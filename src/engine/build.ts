import { gzip } from "env:gzip";
import { dirname } from "env:path";
import type { BuildOptions } from "esbuild";

import { log } from "../logger";
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
    const cacheKey = `${parsedImport.fileName}:${parsedImport.version}`;
    log.info(`Calculating size for ${cacheKey}...`);
    log.info(JSON.stringify(parsedImport));

    const { build } = await import(options?.esbuild ?? "esbuild");

    const directives = parsedImport.directives;

    const platform = directives?.platform || "node";
    log.info(`Building ${parsedImport.name} for ${platform}...`);
    // log.info("Directives: ", directives);

    const { errors, warnings, outputFiles, metafile } = await build({
      stdin: {
        contents: parsedImport.code,
        resolveDir: dirname(parsedImport.fileName),
        sourcefile: parsedImport.fileName
      },
      platform,
      bundle: true,
      format: options?.format || "esm",
      metafile: true,
      write: false,
      external: options?.externals || [],
      outdir: "dist",
      allowOverwrite: true,
      minify: true
    } satisfies BuildOptions);

    log.info("Build result: ", {
      metafile
    });

    let size = 0;
    let gzipSize = 0;
    if (outputFiles.length > 0) {
      size = outputFiles[0].contents.length;
      gzipSize = await gzip(outputFiles[0].contents, {
        level: 9
      }).then(({ length }) => length);
    }

    return {
      errors,
      warnings,
      pkg: {
        ...parsedImport,
        size,
        gzip: gzipSize
      }
    };
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
