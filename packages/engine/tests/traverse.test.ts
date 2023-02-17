import { readFile } from "node:fs/promises";

import { describe, expect, test } from "vitest";

import * as t from "@babel/types";

import { traverse } from "../src/traverse";
import { fixture } from "./shared";

describe("traverse", () => {
  test("expect ImportDeclarations", async () => {
    const ast = JSON.parse(
      await readFile(
        fixture("traverse-asts", "import-declaration.json"),
        "utf-8"
      )
    );
    const imports: {
      type?: string;
      name: string;
    }[] = [];
    traverse(ast, (node) => {
      if (node.type === "ImportDeclaration") {
        const type = node.specifiers[0]?.type;
        imports.push({
          type,
          name: node.source.value
        });
      }
    });

    expect(imports.length).toBe(11);

    expect(imports[0]).toEqual({
      type: "ImportDefaultSpecifier",
      name: "module-name"
    });
  });

  test("require call inside a function", async () => {
    const ast = JSON.parse(
      await readFile(
        fixture("traverse-asts", "require-inside-function.json"),
        "utf-8"
      )
    );

    let _require: string | undefined;
    traverse(ast, (node) => {
      if (node.type === "CallExpression") {
        if (t.isIdentifier(node.callee) && node.callee.name === "require") {
          if (t.isStringLiteral(node.arguments[0])) {
            _require = node.arguments[0].value;
          }
        }
      }
    });

    expect(_require).toBe("react");
  });
});
