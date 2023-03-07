// This file is only used by the extension when building for node,
// otherwise it uses the pako package instead.


import { promisify } from "node:util";
import { gzip as _gzip } from "node:zlib";

export const gzip = promisify(_gzip);
