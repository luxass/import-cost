# Import Cost

### Directives

Import Cost supports the following directives:

- `mark-external` - marks the import as external, so it won't be included in the calculation

- `skip` - skips the import

- `platform-browser` - marks the import as a browser import, so esbuild bundles it for the browser

- `platform-node` - marks the import as a node import, so esbuild bundles it for node (default)

- `format-cjs` - marks the import as a commonjs import, so esbuild bundles it as commonjs

- `format-esm` - marks the import as an esm import, so esbuild bundles it as esm (default)

### Example

```js
/* import-cost: mark-external */
/* import-cost: skip */
/* import-cost: platform-browser */
/* import-cost: platform-node */
/* import-cost: format-cjs */
/* import-cost: format-esm */
```
