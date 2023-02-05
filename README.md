# Import Cost

### Directives

Import Cost supports the following directives:

- `mark-external` - marks the import as external, so it won't be included in the calculation

- `skip` - skips the import

- `platform-browser` - marks the import as a browser import, so esbuild bundles it for the browser 

### Example
```js
/* import-cost: mark-external */
/* import-cost: skip */
/* import-cost: platform-browser */
```
