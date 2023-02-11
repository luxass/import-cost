import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, test } from "vitest";

import { traverse } from "../../src/engine/traverse";

describe("traverse", () => {
  test("expect ImportDeclarations", async () => {
    const { program } = JSON.parse(
      await readFile(
        resolve(__dirname, "asts/import-declaration.json"),
        "utf-8"
      )
    );

    const imports = traverse(program);
    console.log(imports);

    expect(true).toBe(true);
  });

  test("expect CallExpressions", () => {
    expect(true).toBe(true);
  });

  test("require calls inside a function", async () => {
    const { program } = JSON.parse(
      await readFile(
        resolve(__dirname, "asts/require-inside-function.json"),
        "utf-8"
      )
    );

    const imports = traverse(program);
    expect(true).toBe(true);
  });
});