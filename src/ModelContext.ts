import { type ModelContextRegisterToolOptions, type ModelContextTool, type ToolDefinition } from "./types.ts";


type ToolMap = Map<string, ToolDefinition>;


const TOOL_NAME_REGEX: RegExp = /^[A-Za-z0-9_\-.]+$/;


export class ModelContext {
    readonly #toolMap: ToolMap = new Map();

    private static isValidToolName(name: unknown): boolean {
        return (
            (typeof(name) === "string")
            && (name.length >= 1)
            && (name.length <= 128)
            && TOOL_NAME_REGEX.test(name)
        );
    }

    private static throwDOMException(name: string, message: string): never {
        if("DOMException" in globalThis) throw new globalThis.DOMException(message, name);

        const err: Error = new Error(message);

        err.name = name;

        throw err;
    }

    /**
     * Internal accessor for tool map of a given ModelContext.
     * Exposed statically, so controlled registries can read tools without loading the spec-compliant public API.
     */
    public static getInternalToolMap(context: ModelContext): ToolMap {
        return context.#toolMap;
    }

    public registerTool(tool: ModelContextTool, options: ModelContextRegisterToolOptions = {}) {
        if(
            (typeof(tool.name) !== "string")
            || (tool.name.length === 0)
        ) {
            ModelContext.throwDOMException(
                "InvalidStateError",
                "Tool name must be a non-empty string."
            );
        }

        if (
            (typeof(tool.description) !== "string")
            || (tool.description.length === 0)
        ) {
            ModelContext.throwDOMException(
                "InvalidStateError",
                "Tool description must be a non-empty string."
            );
        }
 
        if(this.#toolMap.has(tool.name)) {
            ModelContext.throwDOMException(
                "InvalidStateError",
                `Tool named '${tool.name}' is already registered.`
            );
        }
 
        if(!ModelContext.isValidToolName(tool.name)) {
            ModelContext.throwDOMException(
                "InvalidStateError",
                `Invalid tool name '${tool.name}' (must only use 1-128 ASCII alphanumeric characters, '_', '-', or '.'`
            );
        }
 
        let serializedInputSchema: string = "";
        if(tool.inputSchema !== undefined) {
            serializedInputSchema = JSON.stringify(tool.inputSchema);

            if(serializedInputSchema === undefined) {
                throw new TypeError(
                    "registerTool: tool.inputSchema serialized to undefined."
                );
            }
        }
 
        const readOnlyHint: boolean = !!(tool.annotations && tool.annotations.readOnlyHint);
        const untrustedContentHint: boolean = !!(tool.annotations && tool.annotations.untrustedContentHint);
 
        const signal: AbortSignal | undefined = options ? options.signal : undefined;
        if(signal) {
            if(signal.aborted) {
                console.warn(`Tool '${tool.name}' registration was aborted.`);

                return;
            }

            signal.addEventListener("abort", () => this.#toolMap.delete(tool.name), { once: true });
        }
 
        this.#toolMap
            .set(tool.name, {
                name: tool.name,
                title: tool.title ?? null,
                description: tool.description,
                inputSchema: serializedInputSchema,
                execute: tool.execute,
                readOnlyHint,
                untrustedContentHint
            });
    }
}