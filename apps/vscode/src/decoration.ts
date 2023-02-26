// import { filesize } from "import-cost-engine";
import { filesize } from "filesize";
// import type { ImportSize } from "import-cost-engine";
import type {
  DecorationOptions,
  DecorationRenderOptions,
  TextDocument,
  TextEditor
} from "vscode";
import { Position, Range, window } from "vscode";

import { config } from "./configuration";
import { log } from "./logger";

const MARGIN = 1;
const FONT_STYLE = "normal";

const decorationType = window.createTextEditorDecorationType({});

export function flush(editor?: TextEditor) {
  log.info("Flushing decorations");
  if (!editor) {
    return;
  }

  editor.setDecorations(decorationType, []);
}
// export function decorate(document: TextDocument, imports: ImportSize[]) {
export function decorate(document: TextDocument, imports: any[]) {
  const decorations: DecorationOptions[] = [];
  const editor = window.activeTextEditor;
  if (!editor) {
    return;
  }
  // flushDebounced(editor);
  log.info("Decorating", editor, document);
  imports.forEach((importSize) => {
    const color = getDecorationColor(importSize);
    const message = getDecorationMessage(importSize);

    decorations.push({
      range: new Range(
        new Position(importSize.line - 1, 1024),
        new Position(importSize.line - 1, 1024)
      ),
      renderOptions: {
        ...color,
        ...message
      }
    });
  });

  editor.setDecorations(decorationType, decorations);
}
// function getDecorationColor(importSize: ImportSize): DecorationRenderOptions {
function getDecorationColor(importSize: any): DecorationRenderOptions {
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

// function getDecorationMessage(importSize: ImportSize): DecorationRenderOptions {
function getDecorationMessage(importSize: any): DecorationRenderOptions {
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
