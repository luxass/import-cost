import { parsePackages } from "./packages";
import type { CostResult, Options } from "./types";

export async function calculateCost({
  path,
  language,
  external,
  code
}: Options): Promise<CostResult | null> {
  try {

    if (language === "astro" || language === "vue" || language === "svelte") {
      let c = extractCode(code, language);
    }

    // const packages = parsePackages(code, language);

    // console.log("packages", packages);

    return {
      imports: []
    };
  } catch (e) {
    console.error(e);
    return null;
  }
}

function extractCode(code: string, language: string) {
  if (language === "astro") {
    const match = code.match(/<script>([\s\S]*)<\/script>/);

    console.log("MATCH", match);

  } else if (language === "vue" || language === "svelte") {
    const match = code.match(/<script>([\s\S]*)<\/script>/);

    console.log("MATCH", match);
  }
}

export type { CostResult, Options, Language } from "./types";
export { parsePackages } from "./packages";
