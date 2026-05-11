// src/ModelContext.ts
var TOOL_NAME_REGEX = /^[A-Za-z0-9_\-.]+$/;
var ModelContext = class _ModelContext {
  #toolMap = /* @__PURE__ */ new Map();
  static isValidToolName(name) {
    return typeof name === "string" && name.length >= 1 && name.length <= 128 && TOOL_NAME_REGEX.test(name);
  }
  static throwDOMException(name, message) {
    if ("DOMException" in globalThis) throw new globalThis.DOMException(message, name);
    const err = new Error(message);
    err.name = name;
    throw err;
  }
  /**
   * Internal accessor for tool map of a given ModelContext.
   * Exposed statically, so controlled registries can read tools without loading the spec-compliant public API.
   */
  static getInternalToolMap(context) {
    return context.#toolMap;
  }
  registerTool(tool, options = {}) {
    if (typeof tool.name !== "string" || tool.name.length === 0) {
      _ModelContext.throwDOMException(
        "InvalidStateError",
        "Tool name must be a non-empty string."
      );
    }
    if (typeof tool.description !== "string" || tool.description.length === 0) {
      _ModelContext.throwDOMException(
        "InvalidStateError",
        "Tool description must be a non-empty string."
      );
    }
    if (this.#toolMap.has(tool.name)) {
      _ModelContext.throwDOMException(
        "InvalidStateError",
        `Tool named '${tool.name}' is already registered.`
      );
    }
    if (!_ModelContext.isValidToolName(tool.name)) {
      _ModelContext.throwDOMException(
        "InvalidStateError",
        `Invalid tool name '${tool.name}' (must only use 1-128 ASCII alphanumeric characters, '_', '-', or '.'`
      );
    }
    let serializedInputSchema = "";
    if (tool.inputSchema !== void 0) {
      serializedInputSchema = JSON.stringify(tool.inputSchema);
      if (serializedInputSchema === void 0) {
        throw new TypeError(
          "registerTool: tool.inputSchema serialized to undefined."
        );
      }
    }
    const readOnlyHint = !!(tool.annotations && tool.annotations.readOnlyHint);
    const untrustedContentHint = !!(tool.annotations && tool.annotations.untrustedContentHint);
    const signal = options ? options.signal : void 0;
    if (signal) {
      if (signal.aborted) {
        console.warn(`Tool '${tool.name}' registration was aborted.`);
        return;
      }
      signal.addEventListener("abort", () => this.#toolMap.delete(tool.name), { once: true });
    }
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
};

// src/ModelContextClient.ts
var ModelContextClient = class {
  async requestUserInteraction(callback) {
    return await callback();
  }
};

// src/Registry.ts
var Registry = class _Registry {
  #toolMap;
  constructor(context) {
    try {
      this.#toolMap = ModelContext.getInternalToolMap(context);
    } catch {
      throw new TypeError("Could not read from provided model context argument");
    }
  }
  static #snapshotToolDefinition(toolDefinition) {
    const {
      execute,
      ...rest
    } = toolDefinition;
    return rest;
  }
  list() {
    const toolDefinitionSnapshots = [];
    for (const toolDefinition of this.#toolMap.values()) {
      toolDefinitionSnapshots.push(_Registry.#snapshotToolDefinition(toolDefinition));
    }
    return toolDefinitionSnapshots;
  }
  get(name) {
    const toolDefinition = this.#toolMap.get(name);
    return toolDefinition ? _Registry.#snapshotToolDefinition(toolDefinition) : void 0;
  }
  has(name) {
    return this.#toolMap.has(name);
  }
  async invoke(name, input = {}) {
    const toolDefinition = this.#toolMap.get(name);
    if (!toolDefinition) throw new Error(`Registry: no tool named '${name}' is registered.`);
    return toolDefinition.execute(input, new ModelContextClient());
  }
};
export {
  ModelContext,
  ModelContextClient,
  Registry
};
