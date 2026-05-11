import { type RegisteredTool, type ToolRegistry, type ModelContextTool } from "./types.ts";
export declare class Registry implements ToolRegistry {
    #private;
    private static isValidToolName;
    private static throwDOMException;
    list(): RegisteredTool[];
    setUnsafe(tool: ModelContextTool): void;
    set(tool: ModelContextTool): void;
    get(name: string): RegisteredTool | undefined;
    has(name: string): boolean;
    delete(name: string): void;
    invoke(name: string, input?: object): Promise<unknown>;
}
