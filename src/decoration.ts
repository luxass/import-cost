import { filesize } from "filesize";
import type {
  DecorationOptions,
  DecorationRenderOptions,
  TextDocument,
  TextEditor
} from "vscode";
import { window } from "vscode";

import { config } from "./configuration";
import type { ImportSize } from "./engine/types";
import { log } from "./logger";

const MARGIN = 1;
const FONT_STYLE = "normal";

const DECORATIONS = new Map<any, any>();

export function flush(editor?: TextEditor) {
  log.info("Flushing decorations");
  if (!editor) {
    return;
  }

  editor.setDecorations(window.createTextEditorDecorationType({}), []);
}

export function decorate(document: TextDocument, imports: ImportSize[]) {
  // TODO: Improve performance of this.

  const decorations: DecorationOptions[] = [];
  const editor = window.activeTextEditor;
  if (!editor) {
    return;
  }
  imports.forEach((importSize) => {
    const range = document.lineAt(importSize.line - 1).range;

    const color = getDecorationColor(importSize);
    const message = getDecorationMessage(importSize);

    decorations.push({
      range,
      renderOptions: {
        ...color,
        ...message
      }
    });
  });

  editor.setDecorations(window.createTextEditorDecorationType({}), decorations);
}

// let timer: NodeJS.Timeout;
// function debounceFlushDecorations(fileName: string) {
//   clearTimeout(timer);
//   timer = setTimeout(flushDecorations.bind(null, fileName), 20);
// }

// function flushDecorations(fileName: string) {
//   const arr: DecorationOptions[] = [];
//   const map = DECORATIONS.get(fileName);
//   if (map) {
//     for (const line of map.keys()) {
//       const data = map.get(line)!;
//       if (data.size === 0) continue;
//       arr.push({
//         range: new Range(
//           new Position(line - 1, 1024),
//           new Position(line - 1, 1024)
//         ),
//         renderOptions: {
//           ...getDecorationColor(data),
//           ...getDecorationMessage(data)
//         }
//       });
//     }
//   }
//   for (const editor of window.visibleTextEditors) {
//     if (editor.document.fileName === fileName) {
//       editor.setDecorations(decorationType, arr);
//     }
//   }
// }

function getDecorationColor(importSize: ImportSize): DecorationRenderOptions {
  const sizes = config.get("sizes");
  const colors = config.get("colors");

  const size =
    (config.get("sizeColor") === "minified" ?
      importSize.size.bytes :
      importSize.size.gzip) / 1024;

  if (size < sizes.small) {
    return getColors(colors.small.dark, colors.small.light);
  } else if (size < sizes.medium) {
    return getColors(colors.medium.dark, colors.medium.light);
  } else if (size < sizes.large) {
    return getColors(colors.large.dark, colors.large.light);
  } else {
    return getColors(colors.extreme.dark, colors.extreme.light);
  }
}

function getColors(dark: string, light: string) {
  return {
    dark: {
      after: {
        color: dark
      }
    },
    light: {
      after: {
        color: light
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

  if (decorator === "minified") {
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
