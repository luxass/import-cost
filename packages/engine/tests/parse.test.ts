import { readFile } from "node:fs/promises";

import { describe, expect, test } from "vitest";

import { extractCode, parseImports } from "../src/parse";
import type { Language } from "../src/types";
import { fixture } from "./shared";

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#syntax

describe("parse imports", () => {
  test("import default", () => {
    const content = "import React from 'react';";
    const imports = parseImports({
      fileName: "file.ts",
      content,
      language: "ts"
    });

    expect(imports).toEqual([
      {
        fileName: "file.ts",
        name: "react",
        line: 1,
        code: "import React from 'react'\nconsole.log(React);",
        directives: {}
      }
    ]);
  });

  test("import default type", () => {
    const content = "import type React from 'react';";
    const imports = parseImports({
      fileName: "file.ts",
      content,
      language: "ts"
    });

    expect(imports).toEqual([]);
  });

  test("import multiple", () => {
    const content = `
      import React from 'react';
      import { type NextAuthOptions, getServerSession, type DefaultSession } from 'next-auth';
      
      // This import should be skipped.
      import type { GetServerSidePropsContext } from 'next';
      // This import should be skipped.
      import { type GetServerSideProps } from 'next';

    `;

    const [react, nextAuth] = parseImports({
      fileName: "file.ts",
      content,
      language: "ts"
    });

    expect(react).toEqual({
      fileName: "file.ts",
      name: "react",
      line: 2,
      code: "import React from 'react'\nconsole.log(React);",
      directives: {}
    });

    expect(nextAuth.code).toEqual(
      "import { getServerSession } from 'next-auth'\nconsole.log({ getServerSession });"
    );
  });

  test("import with sideeffects", () => {
    const content = "import 'react';";
    const [react] = parseImports({
      fileName: "file.ts",
      content,
      language: "ts"
    });

    expect(react).toEqual({
      fileName: "file.ts",
      name: "react",
      line: 1,
      code: "import * as tmp from 'react'\nconsole.log(tmp);",
      directives: {}
    });
  });
});

describe("parse imports with directives", () => {
  test("import default with directives", () => {
    const content = `
      /* import-cost: platform-browser */
      /* import-cost: format-cjs */
      /* import-cost: mark-external */
      import React from "react";
    `;

    const imports = parseImports({
      fileName: "file.ts",
      content,
      language: "ts"
    });
    const parsedImport = imports[0];

    expect(parsedImport.directives).toStrictEqual({
      platform: "browser",
      format: "cjs",
      external: true
    });
  });

  test("import default type with directives", () => {
    const content = `
      /* import-cost: platform-browser */
      /* import-cost: format-cjs */
      /* import-cost: skip */
      /* import-cost: mark-external */
      import type React from "react";
    `;

    const imports = parseImports({
      fileName: "file.ts",
      content,
      language: "ts"
    });

    expect(imports).toEqual([]);
  });

  test("import multiple with directives", () => {
    const content = `
      /* import-cost: format-cjs */
      /* import-cost: mark-external */
      import React from "react";

      import type { GetServerSidePropsContext } from "next";
      import {
        getServerSession,
        type NextAuthOptions,
        type DefaultSession,
      } from "next-auth";
    `;

    const imports = parseImports({
      fileName: "file.ts",
      content,
      language: "ts"
    });

    const [react, nextAuth] = imports;

    expect(react.directives).toStrictEqual({
      format: "cjs",
      external: true
    });

    expect(nextAuth.code).toEqual(
      "import { getServerSession } from 'next-auth'\nconsole.log({ getServerSession });"
    );
  });
});

describe("extract code", () => {
  describe("astro", () => {
    test("extract code in astro file", async () => {
      const fixturePath = fixture("astro", "app.astro");
      const content = await readFile(fixturePath, "utf-8");

      const result = extractCode(content, "astro");

      expect(result).not.toBeNull();

      const { code, language } = result!;

      expect(language).toEqual("ts");

      expect(code).toEqual(
        "import { map } from \"lodash\"\n\nexport interface Props {\n  title: string;\n}\n\nconst { title } = Astro.props;\n\nconst doubled = map([1, 2, 3], (n) => n * 2);"
      );
    });

    test("expect null from astro file", async () => {
      const fixturePath = fixture("astro", "app-with-error.astro");
      const content = await readFile(fixturePath, "utf-8");

      const result = extractCode(content, "astro");

      expect(result).toBeNull();
    });
  });

  describe("svelte", async () => {
    test("svelte with lang set to ts", async () => {
      const fixturePath = fixture("svelte", "svelte-ts.svelte");
      const content = await readFile(fixturePath, "utf-8");

      const result = extractCode(content, "svelte");

      expect(result).not.toBeNull();

      const { code, language } = result!;

      expect(language).toEqual<Language>("svelte-ts");
      expect(code).toEqual(
        `import { confetti } from "@neoconfetti/svelte";

  export const name = "import-cost";

  function getName() {
    return name;
  }

  $: document.title = name;
  $: {
    console.log("hi");
  }
  $: _name = getName();`
      );
    });

    test("svelte with no lang set", async () => {
      const fixturePath = fixture("svelte", "svelte-js.svelte");
      const content = await readFile(fixturePath, "utf-8");

      const result = extractCode(content, "svelte");

      expect(result).not.toBeNull();

      const { code, language } = result!;

      expect(language).toEqual<Language>("svelte");
      expect(code).toEqual(
        `import { confetti } from "@neoconfetti/svelte";

  export const name = "import-cost";

  function getName() {
    return name;
  }

  $: document.title = name;
  $: {
    console.log("hi");
  }
  $: _name = getName();`
      );
    });

    test("expect null from svelte file", async () => {
      const fixturePath = fixture("svelte", "svelte-with-error.svelte");
      const content = await readFile(fixturePath, "utf-8");

      const result = extractCode(content, "svelte");

      expect(result).toBeNull();
    });
  });

  describe("vue", async () => {
    test("vue with lang set to ts", async () => {
      const fixturePath = fixture("vue", "vue-ts.vue");
      const content = await readFile(fixturePath, "utf-8");

      const result = extractCode(content, "vue");

      expect(result).not.toBeNull();

      const { code, language } = result!;

      expect(language).toEqual<Language>("vue-ts");

      expect(code).toEqual(
        "import { map } from \"lodash\";\n\nconst arr = [1, 2, 3];\nconst doubled: number[] = map(arr, (n) => n * 2);"
      );
    });

    test("vue with no lang set", async () => {
      const fixturePath = fixture("vue", "vue-js.vue");
      const content = await readFile(fixturePath, "utf-8");

      const result = extractCode(content, "vue");

      expect(result).not.toBeNull();

      const { code, language } = result!;

      expect(language).toEqual<Language>("vue");
      expect(code).toEqual(
        "import { map } from \"lodash\";\n\nconst arr = [1, 2, 3];\nconst doubled = map(arr, (n) => n * 2);"
      );
    });

    test("expect null from vue file", async () => {
      const fixturePath = fixture("vue", "vue-with-error.vue");
      const content = await readFile(fixturePath, "utf-8");

      const result = extractCode(content, "vue");

      expect(result).toBeNull();
    });
  });
});
