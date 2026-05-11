# WebMCP polyfill

[WebMCP Draft (23 April 2026)](https://webmachinelearning.github.io/webmcp) compliant API polyfill:

- `ModelContext`
- `ModelContextClient`
- `navigator.modelContext`

### Integrate

#### Browser

``` html
<script src="https://cdn.jsdelivr.net/gh/webfuse-com/WebMCP-polyfill@main/dist/webmcp-polyfill.js"></script>
```

#### Module

``` console
npm install webfuse-com/WebMCP-polyfill
```

``` js
import {
    ModelContext,
    ModelContextClient
} "@webfuse-com/webmcp-polyfill";
```