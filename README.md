# WebMCP polyfill

[WebMCP Draft (23 April 2026)](https://webmachinelearning.github.io/webmcp) compliant API polyfill.

- `ModelContext`
- `ModelContextClient`
- `document.modelContext`

## Integrate

### Browser

``` html
<script src="https://cdn.jsdelivr.net/gh/webfuse-com/WebMCP-polyfill@main/dist/webmcp-polyfill.js"></script>
```

### Module

``` console
npm install webfuse-com/WebMCP-polyfill
```

``` js
import { ModelContext, ModelContextClient } from "@webfuse-com/webmcp-polyfill";
```

## Usage

`registerTool()` returns a promise: `await` it and handle registration failures via `catch`.

``` js
await document.modelContext
  .registerTool({
    name: "get_products",
    description: "List all products in the current page.",
    annotations: { readOnlyHint: true },
    execute: () => state.getProducts()
  });

try {
  await document.modelContext
    .registerTool({
      name: "add_product_to_cart",
      description: "Add a product to the user's shopping cart.",
      inputSchema: {
        type: "object",
        properties: { product_id: { type: "string" } },
        required: [ "product_id" ]
      },
      execute: async ({ product_id }) => {
        await state.cart.addToCart(product_id);
        return {
          ok: true,
          product_id
        };
      }
    });
} catch (e) {
  console.error("Tool registration failed:", e);
}
```

### WebMCP Registry `non-spec`

The experimental `navigator.modelContextTesting` global allows maintaining an [_AI agent queue_](https://webmachinelearning.github.io/webmcp/#ai-agent-queue) right in the web page's script execution scope.

``` ts
navigator.modelContextTesting: ModelContextTesting
```

``` ts
interface RegisteredTool {
  name: string;
  title: string | null;
  description: string;
  inputSchema: string;
  readOnlyHint: boolean;
  untrustedContentHint: boolean;
}

interface ModelContextTesting extends EventTarget {
  // List snapshot for each registered tool.
  listTools(): RegisteredTool[];
  // Invoke a registered tool.
  executeTool(name: string, input?: object | string): Promise<unknown>;
  // Listen for tool changes.
  addEventListener(type: "toolchange", listener: (e: Event) => void): void;
}
```

## Use Cases

### Model-driven Browser Automation

Use WebMCP tools through a browser automation framework (e.g., [Playwright](https://playwright.dev)), including legacy browsers.

### First-Class Access from Browser Extensions

Use WebMCP tools from native browser extensions.

### Web Application MCP Introspection

Reuse WebMCP tools for in-page script execution realms.
