# Import Cost

## Whats missing?

- [ ] Support for Browser (We broke it again :cry:) Should be a easy fix, because we probably only need to fix the issue between Uri and URL
- [ ] Add onConfigurationChanged event to remove the need to call `config.get` on every keystroke.
- [x] Caching
- [ ] Tests
- [x] Skip configuration should be used globally. (using the `import-cost.skip` configuration)
- [ ] Remove type imports from the calculation
- [x] Use format and defaultFormat from the configuration
- [x] Use platform and defaultPlatform from the configuration
- [ ] Add support for showing size of export calculations
- [ ] Add JetBrains Ide Plugin Support

#### Export Calculation

This will probably be used in a different file, but because the extension excludes every file that is coming from the project. This dependency will not be calculated.

We could add some kind of extra property to the parsedImport,  that will mark this file as a dependency, so we can calculate the size.

```js
export { dirname, resolve, parse, join } from "path-browserify";
```

### Allow custom extensions to be used

```jsonc
// .vscode/settings.json
{
  "files.associations": {
    "*.mycustomext": "typescript",
    "*.mycustomext2": "vue",
  }
}
```
> The languages we allow are, `javascript`, `typescript`, `javascriptreact`, `typescriptreact`, `astro`, `svelte` and `vue` 


### Directives

Import Cost supports the following directives:

- `mark-external` or `external` - marks the import as external, so it won't be included in the calculation

- `skip` - skips the import

- `platform-browser` - marks the import as a browser import, so esbuild bundles it for the browser

- `platform-node` - marks the import as a node import, so esbuild bundles it for node (default)

- `platform-neutral` - idk what this does, but it's in the esbuild docs (write something here....)

- `format-cjs` - marks the import as a commonjs import, so esbuild bundles it as commonjs

- `format-esm` - marks the import as an esm import, so esbuild bundles it as esm (default)

- `format-iife` - marks the import as an iife import, so esbuild bundles it as iife

### Example

```js
/* import-cost: mark-external */
/* import-cost: external */
/* import-cost: skip */
/* import-cost: platform-browser */
/* import-cost: platform-node */
/* import-cost: platform-neutral */
/* import-cost: format-cjs */
/* import-cost: format-esm */
/* import-cost: format-iife */
```
