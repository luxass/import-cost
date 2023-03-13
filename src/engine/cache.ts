import type { ImportResult } from "./calculate";

export type CacheResult = Pick<ImportResult, "size">;

export const cache = new Map<string, CacheResult>();
