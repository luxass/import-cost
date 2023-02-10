import { describe, expect, test } from "vitest";

import { calculateCost, extractCode } from "../../src/engine";

describe("extract code", () => {
  describe("astro extract", () => {
    test("extract astro with only ---", () => {
      const content = `
      ---
      import Footer from '~/components/Footer.astro';
      import Header from '~/components/Header.astro';
      import Metatags from '~/components/Metatags.astro';
      
      export interface Props {
        title: string;
      }
      
      const { title } = Astro.props;
      ---
      
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <Metatags title={title} />
        </head>
        <body class="flex flex-col min-h-screen max-w-2xl mx-auto bg-gray-900 font-inter antialiased font-inter">
          <Header />
          <main class="flex-1 p-3 text-white">
            <slot />
          </main>
          <Footer />
        </body>
      </html>
      `;

      const code = extractCode(content, "astro");

      expect(code).toEqual(`
      import Footer from '~/components/Footer.astro';
      import Header from '~/components/Header.astro';
      import Metatags from '~/components/Metatags.astro';

      export interface Props {
        title: string;
      }

      const { title } = Astro.props;
      `);
    });
  });
});
