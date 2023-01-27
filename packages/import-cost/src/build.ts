import { dirname } from "node:path";

import type { CalculateSizeOptions, ParsedImport } from "./types";

export async function calculateSize(
  parsedImport: ParsedImport,
  options?: CalculateSizeOptions
) {
  try {
    const { build } = await import(options?.esbuild ?? "esbuild");

    const { errors, warnings, metafile, outputFiles } = await build({
      stdin: {
        contents: parsedImport.code,
        resolveDir: dirname(parsedImport.fileName),
        sourcefile: parsedImport.fileName
      },
      bundle: true,
      format: options?.format || "esm",
      metafile: true,
      write: false,
      external: options?.externals || [],
      minify: true
    });

    console.log("ERRORS", errors);
    console.log("WARNINGS", warnings);
    console.log("METAFILE", metafile);
    console.log("OUTPUTFILES", outputFiles);
  } catch (e) {
    console.error(e);
  }
}
