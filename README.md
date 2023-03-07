# Import Cost

## Whats missing?

- [ ] Debounce!!!!
- [x] fix caching and decorators
- [ ] Support for Browser
- [ ] Tests

### Allow custom extensions to be used

```json
// .vscode/settings.json
{
  "files.associations": {
    "*.mycustomext": "typescript",
    "*.mycustomext2": "vue"
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
