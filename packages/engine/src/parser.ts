import type { Format, Platform } from "esbuild";

import type { ParserPlugin } from "@babel/parser";
import { parse } from "@babel/parser";
import * as t from "@babel/types";

export type Language =
  | "javascript"
  | "js"
  | "javascriptreact"
  | "jsx"
  | "typescript"
  | "ts"
  | "typescriptreact"
  | "tsx"
  | "vue"
  | "svelte"
  | "astro";

export interface ParseImportsOptions {
  /**
   * Name of the file
   */
  fileName: string;

  /**
   * Content of the file
   *
   * @example
   * ```js
   * import React from "react";
   * import { render } from "react-dom";
   * ```
   */
  content: string;

  /**
   * Language of the file
   */
  language: Language;

  /**
   * List of packages to skip
   */
  skips?: string[];

  /**
   * Format to use for different package
   *
   * @example
   * ```json
   * {
   *  "react": "esm",
   *  "react-dom": "esm"
   * }
   * ```
   */
  formats?: Record<string, Format>;

  /**
   * Platform to use for different package
   *
   * @example
   * ```json
   * {
   *  "react": "browser",
   *  "react-dom": "browser"
   * }
   */
  platforms?: Record<string, Platform>;

  /**
   * Extra babel plugins to use when parsing the file
   */
  plugins?: string[];
}

export interface ImportDirectives {
  external?: boolean;
  platform?: Platform;
  skip?: boolean;
  format?: Format;
}

export interface Import {
  fileName: string;
  name: string;
  line: number;
  code: string;
  version?: string;
  directives: ImportDirectives;
}

export function parseImports({
  fileName,
  content,
  language,
  skips = [],
  formats = {},
  platforms = {},
  plugins = []
}: ParseImportsOptions): Import[] {
  const imports: Import[] = [];

  if (language === "astro" || language === "vue" || language === "svelte") {
    const extracted = extractCode(content, language);
    if (!extracted) {
      return imports;
    }
    language = extracted.language;
    content = extracted.code;
  }

  const ast = parse(content, {
    sourceType: "module",
    plugins: getParserPlugins(language).concat(plugins as ParserPlugin[])
  });

  t.traverseFast(ast, (node) => {
    if (node.type === "ImportDeclaration" && node.importKind !== "type") {
      const directives = getDirectives(node);
      const name = node.source.value;
      if (directives.skip || skips.includes(name) || name.startsWith(".")) {
        return;
      }

      if (!directives.platform && platforms[name]) {
        directives.platform = platforms[name];
      }

      if (!directives.format && formats[name]) {
        directives.format = formats[name];
      }

      imports.push({
        fileName,
        name,
        line: node.loc?.end.line || 0,
        code: getImportString(node),
        directives
      });
    } else if (node.type === "CallExpression") {
      const name = getImportName(node);
      if (node.callee.type === "Import") {
        const directives = getDirectives(node);
        if (directives.skip || skips.includes(name) || name.startsWith(".")) {
          return;
        }

        if (!directives.platform && platforms[name]) {
          directives.platform = platforms[name];
        }

        if (!directives.format && formats[name]) {
          directives.format = formats[name];
        }

        imports.push({
          fileName,
          name,
          line: node.loc?.end.line || 0,
          code: `import("${getImportName(node)}")`,
          directives
        });
      } else if (
        t.isIdentifier(node.callee) &&
        node.callee.name === "require"
      ) {
        const directives = getDirectives(node);
        if (directives.skip || skips.includes(name) || name.startsWith(".")) {
          return;
        }

        if (!directives.platform && platforms[name]) {
          directives.platform = platforms[name];
        }

        if (!directives.format && formats[name]) {
          directives.format = formats[name];
        }

        imports.push({
          fileName,
          name,
          line: node.loc?.end.line || 0,
          code: `require("${getImportName(node)}")`,
          directives
        });
      }
    }
  });

  return imports;
}

function getDirectives(
  node: t.CallExpression | t.ImportDeclaration
): ImportDirectives {
  const directives: ImportDirectives = {};

  if (node.leadingComments) {
    node.leadingComments.forEach((comment) => {
      if (comment.value.includes("import-cost: ")) {
        const directive = comment.value.trim().replace("import-cost: ", "");

        if (directive === "mark-external" || directive === "external") {
          directives.external = true;
          return;
        }

        if (directive.includes("platform-")) {
          const platform = directive.replace("platform-", "");
          if (
            platform !== "browser" &&
            platform !== "node" &&
            platform !== "neutral"
          ) {
            return;
          }
          directives.platform = platform;
        }

        if (directive.includes("format-")) {
          const format = directive.replace("format-", "");
          if (format !== "cjs" && format !== "esm" && format !== "iife") {
            return;
          }
          directives.format = format;
        }

        if (directive === "skip") {
          directives.skip = true;
        }
      }
    });
  }

  return directives;
}

function getImportString(node: t.ImportDeclaration): string {
  const importString =
    node.specifiers.length > 0 ? parseSpecifiers(node) : "* as tmp";

  return `import ${importString} from "${
    node.source.value
  }"\nconsole.log(${importString.replace("* as ", "")});`;
}

function parseSpecifiers(node: t.ImportDeclaration): string {
  let importSpecifier: string | undefined;
  const importSpecifiers = node.specifiers
    // We want to sort type imports to the end
    .sort((s1, s2) => {
      if (t.isImportSpecifier(s1) && t.isImportSpecifier(s2)) {
        return s1.importKind === "type" ? 1 : -1;
      }

      return 0;
    })
    .map((specifier, i) => {
      if (t.isImportNamespaceSpecifier(specifier)) {
        return `* as ${specifier.local.name}`;
      } else if (t.isImportDefaultSpecifier(specifier)) {
        return specifier.local.name;
      } else if (t.isImportSpecifier(specifier)) {
        if (!importSpecifier) {
          importSpecifier = "{ ";
        }

        if (specifier.importKind !== "type") {
          importSpecifier += `${getName(specifier.imported)}`;
        }

        const next = node.specifiers[i + 1] as any;

        if (next && t.isImportSpecifier(next)) {
          if (next.importKind !== "type") {
            importSpecifier += ", ";
          }
          return undefined;
        } else {
          const result = (importSpecifier += " }");
          importSpecifier = undefined;
          return result;
        }
      } else {
        return undefined;
      }
    })
    .filter(Boolean)
    .join(", ");
  return importSpecifiers;
}

function getImportName(node: t.CallExpression): string {
  const argument = node.arguments[0];
  if (t.isTemplateLiteral(argument)) {
    return argument.quasis[0].value.raw;
  }
  return getName(argument);
}

function getName(node: t.Node): string {
  return (
    (t.isStringLiteral(node) && node.value) ||
    (t.isIdentifier(node) && node.name) ||
    ""
  );
}

const SHARED_PLUGINS: ParserPlugin[] = [
  "doExpressions",
  "objectRestSpread",
  ["decorators", { decoratorsBeforeExport: true }],
  "classProperties",
  "asyncGenerators",
  "functionBind",
  "functionSent",
  "dynamicImport"
];

const JS_PLUGINS: ParserPlugin[] = [...SHARED_PLUGINS, "jsx"];
const TS_PLUGINS: ParserPlugin[] = [...SHARED_PLUGINS, "typescript"];
const TSX_PLUGINS: ParserPlugin[] = [...TS_PLUGINS, "jsx"];

export function getParserPlugins(language: Language): ParserPlugin[] {
  switch (language) {
    case "javascript":
    case "js":
    case "javascriptreact":
    case "jsx":
    case "vue":
    case "svelte":
      return JS_PLUGINS;

    case "typescript":
    case "astro":
    case "ts":
      return TS_PLUGINS;

    case "typescriptreact":
    case "tsx":
      return TSX_PLUGINS;

    default:
      return JS_PLUGINS;
  }
}

export function extractCode(
  code: string,
  language: Language
): { code: string; language: Language } | null {
  if (language === "astro") {
    const match = code.match(/(?<=---\n)(?:(?:.|\n)*?)(?=\n---)/);
    if (match) {
      return {
        code: match[0].trim(),
        language: "ts"
      };
    }
  } else if (language === "vue" || language === "svelte") {
    const match = code.match(
      /<script(?:.*?lang="(js|ts)")?[^>]*>([\s\S]*?)<\/script>/
    );

    if (match) {
      return {
        code: match[2].trim(),
        language: (match[1] ?? "js") as Language
      };
    }
  }
  return null;
}
