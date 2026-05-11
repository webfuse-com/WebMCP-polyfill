"use strict";
(() => {
  // src/ModelContext.ts
  var ModelContext = class {
    #registry;
    constructor(registry2) {
      this.#registry = registry2;
    }
    registerTool(tool, options = {}) {
      const signal = options ? options.signal : void 0;
      if (signal?.aborted) {
        console.warn(`Tool '${tool.name}' registration was aborted`);
        return;
      }
      this.#registry.set(tool);
      if (signal) {
        signal.addEventListener("abort", () => {
          this.#registry.delete(tool.name);
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

  // src/Registry.ts
  var TOOL_NAME_REGEX = /^[A-Za-z0-9_\-.]+$/;
  var Registry = class _Registry {
    static isValidToolName(name) {
      return typeof name === "string" && name.length >= 1 && name.length <= 128 && TOOL_NAME_REGEX.test(name);
    }
    static throwDOMException(name, message) {
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
    list() {
      const toolDefinitionSnapshots = [];
      for (const toolDefinition of this.#toolMap.values()) {
        toolDefinitionSnapshots.push(_Registry.#snapshotToolDefinition(toolDefinition));
      }
      return toolDefinitionSnapshots;
    }
    setUnsafe(tool) {
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
    set(tool) {
      if (typeof tool.name !== "string" || tool.name.length === 0) {
        _Registry.throwDOMException(
          "InvalidStateError",
          "Tool name must be a non-empty string"
        );
      }
      if (typeof tool.description !== "string" || tool.description.length === 0) {
        _Registry.throwDOMException(
          "InvalidStateError",
          "Tool description must be a non-empty string"
        );
      }
      if (this.#toolMap.has(tool.name)) {
        _Registry.throwDOMException(
          "InvalidStateError",
          `Tool named '${tool.name}' is already registered`
        );
      }
      if (!_Registry.isValidToolName(tool.name)) {
        _Registry.throwDOMException(
          "InvalidStateError",
          `Invalid tool name '${tool.name}' (must only use 1-128 ASCII alphanumeric characters, '_', '-', or '.'`
        );
      }
      this.setUnsafe(tool);
    }
    get(name) {
      const toolDefinition = this.#toolMap.get(name);
      return toolDefinition ? _Registry.#snapshotToolDefinition(toolDefinition) : void 0;
    }
    has(name) {
      return this.#toolMap.has(name);
    }
    delete(name) {
      this.#toolMap.delete(name);
    }
    async invoke(name, input = {}) {
      const toolDefinition = this.#toolMap.get(name);
      if (!toolDefinition) throw new Error(`Registry: no tool named '${name}' is registered.`);
      return toolDefinition.execute(input, new ModelContextClient());
    }
  };

  // src/api.browser.ts
  var NON_SPEC_REGISTRY_IDENTIFIER = "WebMCP";
  var registry = new Registry();
  Object.defineProperty(window, NON_SPEC_REGISTRY_IDENTIFIER, {
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
          registry.setUnsafe(tool);
        } catch {
        }
        if (options.signal) {
          options.signal.addEventListener(
            "abort",
            () => registry.delete(tool.name),
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
