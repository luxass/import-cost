import type { ParserPlugin } from "@babel/parser";
import { parse } from "@babel/parser";
import * as t from "@babel/types";

import { traverse } from "./traverse";
import type {
  ImportDirectives,
  Language,
  ParseImportsOptions,
  ParsedImport
} from "./types";

export function parseImports({
  fileName,
  content,
  language,
  skips = [],
  formats = {},
  platforms = {}
}: ParseImportsOptions): ParsedImport[] {
  const imports: ParsedImport[] = [];

  if (language === "astro" || language === "vue" || language === "svelte") {
    const extracted = extractCode(content, language);
    if (extracted) {
      content = extracted.code;
      language = extracted.language;
    }
  }

  const ast = parse(content, {
    sourceType: "module",
    plugins: getParserPlugins(language) as ParserPlugin[]
  });

  traverse(ast, (node) => {
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

  return `import ${importString} from '${
    node.source.value
  }'\nconsole.log(${importString.replace("* as ", "")});`;
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
    case "ts":
      return TS_PLUGINS;

    case "typescriptreact":
    case "tsx":
    case "vue-ts":
    case "svelte-ts":
    case "astro":
      return TSX_PLUGINS;

    default:
      return JS_PLUGINS;
  }
}


export function extractCode(
  code: string,
  language: Exclude<Language, "svelte-ts" | "vue-ts">
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
        language: match[1] === "ts" ? `${language}-${match[1]}` : language
      };
    }
  }
  return null;
}
