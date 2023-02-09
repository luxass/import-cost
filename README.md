# Import Cost

## Whats missing?

- [ ] Support for Browser (Buffer is breaking it)
- [ ] Caching
- [ ] Tests
- [ ] Skip configuration should be used globally. (using the `import-cost.skip` configuration)
- [ ] Remove type imports from the calculation
- [ ] Use format and defaultFormat from the configuration
- [ ] Use platform and defaultPlatform from the configuration

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
