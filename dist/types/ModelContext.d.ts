import { type ModelContextRegisterToolOptions, type ModelContextTool } from "./types.ts";
import { ToolRegistry } from "./ToolRegistry.ts";
export declare class ModelContext {
    #private;
    constructor(toolRegistry?: ToolRegistry);
    registerTool(tool: ModelContextTool, options?: ModelContextRegisterToolOptions): Promise<void>;
}
