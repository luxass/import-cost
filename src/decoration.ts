import type {
  DecorationOptions,
  DecorationRenderOptions,
  TextDocument,
  TextEditor
} from "vscode";
import { window } from "vscode";

import { config } from "./configuration";
import type { CalculateResult, ImportResult } from "./engine/calculate";
import { log } from "./log";

const MARGIN = 1;
const FONT_STYLE = "normal";

export function flush(editor?: TextEditor) {
  log.info("Flushing decorations");
  if (!editor) {
    return;
  }

  editor.setDecorations(window.createTextEditorDecorationType({}), []);
}

export function decorate(document: TextDocument, results: CalculateResult[]) {
  // TODO: Improve performance of this.

  const decorations: DecorationOptions[] = [];
  const editor = window.activeTextEditor;
  log.info("Decorating", editor, document);
  if (!editor) {
    return;
  }
  results.forEach((result) => {
    const range = document.lineAt(result.pkg.line - 1).range;

    const color = getDecorationColor(result.pkg.size);
    const message = getDecorationMessage(result.pkg.size);

    decorations.push({
      range,
      renderOptions: {
        ...color,
        ...message
      },
      hoverMessage: `Size: ${result.pkg.size.minifiedFormatted} (${result.pkg.size.gzipFormatted} gzipped)`
    });
  });

  editor.setDecorations(window.createTextEditorDecorationType({}), decorations);
}

function getDecorationColor(
  result: ImportResult["size"]
): DecorationRenderOptions {
  const sizes = config.get("sizes");
  const colors = config.get("colors");

  const size =
    (config.get("sizeColor") === "minified" ? result.minified : result.gzip) /
    1024;

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

function getDecorationMessage({
  minifiedFormatted,
  gzipFormatted
}: ImportResult["size"]): DecorationRenderOptions {
  const decorator = config.get("decorator");

  if (decorator === "minified") {
    return {
      after: {
        contentText: ` ${minifiedFormatted}`,
        margin: `0 0 0 ${MARGIN}em`,
        fontStyle: FONT_STYLE
      }
    };
  } else if (decorator === "compressed") {
    return {
      after: {
        contentText: ` ${gzipFormatted} gzipped`,
        margin: `0 0 0 ${MARGIN}em`,
        fontStyle: FONT_STYLE
      }
    };
  } else {
    return {
      after: {
        contentText: ` ${minifiedFormatted} (${gzipFormatted} gzipped)`,
        margin: `0 0 0 ${MARGIN}em`,
        fontStyle: FONT_STYLE
      }
    };
  }
}
