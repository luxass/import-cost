import { describe, expect, test } from "vitest";

import { parseImports } from "../../src/engine/parse";

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#syntax

describe("parse imports", () => {
  test("import default", () => {
    const content = "import React from 'react';";
    const imports = parseImports("file.ts", content, "ts");

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
    const imports = parseImports("file.ts", content, "ts");

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

    const [react, nextAuth] = parseImports("file.ts", content, "ts");

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
    const [react] = parseImports("file.ts", content, "ts");

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

    const imports = parseImports("file.ts", content, "ts");
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

    const imports = parseImports("file.ts", content, "ts");

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

    const imports = parseImports("file.ts", content, "ts");

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
