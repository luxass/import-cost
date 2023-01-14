import type { CostResult, Options } from "./types";

export async function calculateCost({
  path,
  language,
  external,
  code
}: Options): Promise<CostResult | null> {
  try {
    console.log(path, language, external);

    console.log(code);

    if (language === "astro" || language === "vue" || language === "svelte") {
      
    }

    return {
      imports: []
    };
  } catch (e) {
    console.error(e);
    return null;
  }
}

export type { CostResult, Options } from "./types";
export { getPackages } from "./packages";
