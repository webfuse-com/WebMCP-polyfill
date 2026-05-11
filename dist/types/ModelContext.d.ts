import { type ModelContextRegisterToolOptions, type ModelContextTool } from "./types.ts";
import { Registry } from "./Registry.ts";
export declare class ModelContext {
    #private;
    constructor(registry: Registry);
    registerTool(tool: ModelContextTool, options?: ModelContextRegisterToolOptions): void;
}
