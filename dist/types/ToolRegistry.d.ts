import { type RegisteredTool, type ModelContextTool, type ModelContextTesting } from "./types.ts";
export declare class ToolRegistry extends EventTarget implements ModelContextTesting {
    #private;
    __setUnsafe(tool: ModelContextTool): void;
    __set(tool: ModelContextTool): void;
    __get(name: string): RegisteredTool | undefined;
    __has(name: string): boolean;
    __delete(name: string): void;
    listTools(): RegisteredTool[];
    executeTool(name: string, input?: object | string): Promise<unknown>;
}
