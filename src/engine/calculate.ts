import { gzip } from "env:gzip";
import { dirname } from "env:path";
import type { BuildOptions } from "esbuild";
import { filesize } from "filesize";
import { Uri } from "vscode";

import { config } from "../configuration";
import { find } from "../find";
import { log } from "../log";
import { cache } from "./cache";
import type { Import } from "./parser";

export interface CalculateOptions {
  /**
   * The path to the esbuild binary.
   */
  esbuildBinary: string;

  /**
   * An array of dependencies to exclude from the calculation.
   */
  externals: string[];

  /**
   * The current working directory.
   */
  cwd: Uri;
}

export type ImportResult = {
  size: {
    minified: number;
    minifiedFormatted: string;
    gzip: number;
    gzipFormatted: string;
  };
} & Import;

export async function calculate(
  parsedImports: Import[],
  options: CalculateOptions
): Promise<ImportResult[]> {
  const results = await Promise.all<ImportResult>(
    parsedImports.map(async (parsedImport) => {
      try {
        const cacheKey = `${parsedImport.code}@${parsedImport.name}:${parsedImport.version}`;
        const cachedResult = cache.get(cacheKey);
        if (cachedResult) {
          log.info(
            `Using cached result for ${parsedImport.name}:${parsedImport.version}`
          );
          return {
            ...parsedImport,
            ...cachedResult
          };
        }

        const { build }: typeof import("esbuild") = await import(
          "esbuild-wasm"
        );

        const directives = parsedImport.directives;
        const platform =
          directives.platform || config.get("platform") || "node";
        const format = directives.format || config.get("format") || "esm";
        log.info(
          `Building ${parsedImport.name} for platform-${platform} and format-${format}...`
        );

        const { errors, warnings, outputFiles } = await build({
          stdin: {
            contents: parsedImport.code,
            resolveDir: dirname(parsedImport.fileName),
            sourcefile: parsedImport.fileName
          },
          plugins: [
            {
              name: "esbuild-vscode-web",
              setup(build) {
                build.onResolve(
                  {
                    filter: /.*/
                  },
                  async (args) => {
                    log.info("RESOLVE", args);
                    const node_modules = await find(
                      "node_modules",
                      Uri.file(args.importer)
                    );

                    return {
                      path: args.path,
                      namespace: "esbuild-vscode-web",
                      pluginData: {
                        node_modules
                      }
                    };
                  }
                );

                build.onLoad(
                  {
                    filter: /.*/,
                    namespace: "esbuild-vscode-web"
                  },
                  async (args) => {
                    log.info("LOAD", args);
                    const node_modules = args.pluginData.node_modules;
                    if (node_modules) {
                      const path = await find(
                        args.path,
                        Uri.file(node_modules)
                      );
                      log.info("PATH", path);
                    }
                    return {
                      contents: args.path,
                      loader: "text"
                    };
                  }
                );
              }
            }
          ],
          bundle: true,
          format,
          platform,
          write: false,
          external: options.externals || [],
          outdir: "dist",
          minify: true,
          mainFields:
            platform === "browser" ?
                ["browser", "module", "main"] :
                ["module", "main"],
          legalComments: "none",
          metafile: true
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

        log.info("LETSGO", errors, warnings);

        if (errors.length > 0) {
          log.error(errors);
        }

        if (warnings.length > 0) {
          log.warn(warnings);
        }

        const sizes: Pick<ImportResult, "size"> = {
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

        cache.set(cacheKey, sizes);

        return {
          ...parsedImport,
          ...sizes
        };
      } catch (e) {
        log.error(e);
        return {
          ...parsedImport,
          size: {
            minified: 0,
            minifiedFormatted: "0 B",
            gzip: 0,
            gzipFormatted: "0 B"
          }
        };
      }
    })
  );

  return results;
}
