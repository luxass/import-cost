import { filesize } from "filesize";
import type { DecorationRenderOptions } from "vscode";

import { config } from "./configuration";
import type { ImportSize } from "./engine/types";
import { log } from "./logger";

const MARGIN = 1;

const FONT_STYLE = "normal";

export function flush() {
  log.info("flush");
}

export function decorate() {
  log.info("decorate");
}

function getDecorationColor(importSize: ImportSize): DecorationRenderOptions {
  return {
    dark: {
      after: {
        color: "rgba(255, 255, 255, 0.5)"
      }
    },
    light: {
      after: {
        color: "rgba(0, 0, 0, 0.5)"
      }
    }
  };
}

function getDecorationMessage(importSize: ImportSize): DecorationRenderOptions {
  const size = filesize(importSize.size.bytes, {
    base: 2,
    standard: "jedec"
  });

  const gzip = filesize(importSize.size.gzip, {
    base: 2,
    standard: "jedec"
  });

  const decorator = config.get("decorator");

  if (decorator === "minfied") {
    return {
      after: {
        contentText: ` ${size}`,
        margin: `0 0 0 ${MARGIN}em`,
        fontStyle: FONT_STYLE
      }
    };
  } else if (decorator === "compressed") {
    return {
      after: {
        contentText: ` ${gzip}`,
        margin: `0 0 0 ${MARGIN}em`,
        fontStyle: FONT_STYLE
      }
    };
  } else {
    return {
      after: {
        contentText: ` ${size} (${gzip})`,
        margin: `0 0 0 ${MARGIN}em`,
        fontStyle: FONT_STYLE
      }
    };
  }
}
