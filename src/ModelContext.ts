import { type ModelContextRegisterToolOptions, type ModelContextTool, type ToolDefinition } from "./types.ts";
import { Registry } from "./Registry.ts";


export class ModelContext {
    readonly #registry: Registry;
 
    constructor(registry: Registry) {
        this.#registry = registry;
    }

    public registerTool(tool: ModelContextTool, options: ModelContextRegisterToolOptions = {}) {
        const signal: AbortSignal | undefined = options ? options.signal : undefined;

        if(signal?.aborted) {
            console.warn(`Tool '${tool.name}' registration was aborted`);

            return;
        }

        this.#registry.set(tool);

        if(signal) {
            signal.addEventListener("abort", () => {
                this.#registry.delete(tool.name);
            }, { once: true });
        }
    }
}