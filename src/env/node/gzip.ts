import { promisify } from "node:util";
import { gzip as _gzip } from "node:zlib";

export const gzip = promisify(_gzip);
