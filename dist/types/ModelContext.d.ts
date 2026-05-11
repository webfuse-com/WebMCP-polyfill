import { type ModelContextRegisterToolOptions, type ModelContextTool, type ToolDefinition } from "./types.ts";
type ToolMap = Map<string, ToolDefinition>;
export declare class ModelContext {
    #private;
    private static isValidToolName;
    private static throwDOMException;
    /**
     * Internal accessor for tool map of a given ModelContext.
     * Exposed statically, so controlled registries can read tools without loading the spec-compliant public API.
     */
    static getInternalToolMap(context: ModelContext): ToolMap;
    registerTool(tool: ModelContextTool, options?: ModelContextRegisterToolOptions): void;
}
export {};
