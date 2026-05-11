import { type ModelContextRegisterToolOptions, type ModelContextTool, type ToolDefinition } from "./types.ts";
import { ToolRegistry } from "./ToolRegistry.ts";


export class ModelContext {
    readonly #registry?: ToolRegistry;
 
    constructor(toolRegistry?: ToolRegistry) {
        this.#registry = toolRegistry;
    }

    public registerTool(tool: ModelContextTool, options: ModelContextRegisterToolOptions = {}) {
        const signal: AbortSignal | undefined = options ? options.signal : undefined;

        if(signal?.aborted) {
            console.warn(`Tool '${tool.name}' registration was aborted`);

            return;
        }

        this.#registry?.__set(tool);

        if(signal) {
            signal.addEventListener("abort", () => {
                this.#registry?.__delete(tool.name);
            }, { once: true });
        }
    }
}