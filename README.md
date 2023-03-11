# Import Cost

## Whats missing?

- [x] Debounce
- [x] fix caching and decorators
- [ ] Support for Browser
  - [ ] Binary issues (the binary is 10mb, probably too much to send with the extension? Maybe we can download it instead.)
  - [ ] Symlinks (we need to find a way to resolve the symlink to the real path)
        Maybe we could do something with resolving every package.json and then checking the version there instead?
        Or we could check inside the pnpm-lock.yaml file?

        We also need to find a way to do this with yarn
        
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
