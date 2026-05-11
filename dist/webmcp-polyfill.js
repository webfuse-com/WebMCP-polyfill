"use strict";
(() => {
  // src/ModelContext.ts
  var ModelContext = class {
    #registry;
    constructor(toolRegistry) {
      this.#registry = toolRegistry;
    }
    registerTool(tool, options = {}) {
      const signal = options ? options.signal : void 0;
      if (signal?.aborted) {
        console.warn(`Tool '${tool.name}' registration was aborted`);
        return;
      }
      this.#registry?.__set(tool);
      if (signal) {
        signal.addEventListener("abort", () => {
          this.#registry?.__delete(tool.name);
        }, { once: true });
      }
    }
  };

  // src/ModelContextClient.ts
  var ModelContextClient = class {
    async requestUserInteraction(callback) {
      return await callback();
    }
  };

  // src/ToolRegistry.ts
  var TOOL_NAME_REGEX = /^[A-Za-z0-9_\-.]+$/;
  var ToolRegistry = class _ToolRegistry {
    static #isValidToolName(name) {
      return typeof name === "string" && name.length >= 1 && name.length <= 128 && TOOL_NAME_REGEX.test(name);
    }
    static #throwDOMException(name, message) {
      if ("DOMException" in globalThis) throw new globalThis.DOMException(message, name);
      const err = new Error(message);
      err.name = name;
      throw err;
    }
    static #snapshotToolDefinition(toolDefinition) {
      const {
        execute,
        ...rest
      } = toolDefinition;
      return rest;
    }
    #toolMap = /* @__PURE__ */ new Map();
    __setUnsafe(tool) {
      let serializedInputSchema = "";
      if (tool.inputSchema !== void 0) {
        serializedInputSchema = JSON.stringify(tool.inputSchema);
        if (serializedInputSchema === void 0) {
          throw new TypeError(
            "Tool input schema serialized to undefined"
          );
        }
      }
      const readOnlyHint = !!(tool.annotations && tool.annotations.readOnlyHint);
      const untrustedContentHint = !!(tool.annotations && tool.annotations.untrustedContentHint);
      this.#toolMap.set(tool.name, {
        name: tool.name,
        title: tool.title ?? null,
        description: tool.description,
        inputSchema: serializedInputSchema,
        execute: tool.execute,
        readOnlyHint,
        untrustedContentHint
      });
    }
    __set(tool) {
      if (typeof tool.name !== "string" || tool.name.length === 0) {
        _ToolRegistry.#throwDOMException(
          "InvalidStateError",
          "Tool name must be a non-empty string"
        );
      }
      if (typeof tool.description !== "string" || tool.description.length === 0) {
        _ToolRegistry.#throwDOMException(
          "InvalidStateError",
          "Tool description must be a non-empty string"
        );
      }
      if (this.#toolMap.has(tool.name)) {
        _ToolRegistry.#throwDOMException(
          "InvalidStateError",
          `Tool named '${tool.name}' is already registered`
        );
      }
      if (!_ToolRegistry.#isValidToolName(tool.name)) {
        _ToolRegistry.#throwDOMException(
          "InvalidStateError",
          `Invalid tool name '${tool.name}' (must only use 1-128 ASCII alphanumeric characters, '_', '-', or '.'`
        );
      }
      this.__setUnsafe(tool);
    }
    __get(name) {
      const toolDefinition = this.#toolMap.get(name);
      return toolDefinition ? _ToolRegistry.#snapshotToolDefinition(toolDefinition) : void 0;
    }
    __has(name) {
      return this.#toolMap.has(name);
    }
    __delete(name) {
      this.#toolMap.delete(name);
    }
    listTools() {
      const toolDefinitionSnapshots = [];
      for (const toolDefinition of this.#toolMap.values()) {
        toolDefinitionSnapshots.push(_ToolRegistry.#snapshotToolDefinition(toolDefinition));
      }
      return toolDefinitionSnapshots;
    }
    async executeTool(name, input = {}) {
      const toolDefinition = this.#toolMap.get(name);
      if (!toolDefinition) throw new Error(`Tool '${name}' is not registered`);
      const parsedInput = typeof input === "string" ? JSON.parse(input) : input;
      return toolDefinition.execute(parsedInput, new ModelContextClient());
    }
  };

  // src/api.browser.ts
  var NON_SPEC_REGISTRY_IDENTIFIER = "modelContextTesting";
  var registry = new ToolRegistry();
  Object.defineProperty(window.navigator, NON_SPEC_REGISTRY_IDENTIFIER, {
    value: registry,
    writable: false,
    enumerable: false,
    configurable: false
  });
  if (!("modelContext" in navigator)) {
    const modelContext = new ModelContext(registry);
    Object.defineProperty(window.navigator, "modelContext", {
      value: modelContext,
      writable: false,
      enumerable: true,
      configurable: false
    });
    Object.defineProperty(window, "ModelContext", {
      value: ModelContext,
      writable: false,
      enumerable: false,
      configurable: false
    });
    Object.defineProperty(window, "ModelContextClient", {
      value: ModelContextClient,
      writable: false,
      enumerable: false,
      configurable: false
    });
  } else {
    const nativeModelContext = navigator.modelContext;
    const nativeRegisterTool = nativeModelContext.registerTool.bind(navigator.modelContext);
    Object.defineProperty(nativeModelContext, "registerTool", {
      value: function(tool, options = {}) {
        nativeRegisterTool(tool, options);
        if (options.signal?.aborted) return;
        try {
          registry.__setUnsafe(tool);
        } catch {
        }
        if (options.signal) {
          options.signal.addEventListener(
            "abort",
            () => registry.__delete(tool.name),
            { once: true }
          );
        }
      },
      writable: false,
      enumerable: true,
      configurable: false
    });
  }
})();
