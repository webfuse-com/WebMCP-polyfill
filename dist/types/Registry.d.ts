import { type RegisteredTool, type ToolRegistry } from "./types.ts";
import { ModelContext } from "./ModelContext.ts";
export declare class Registry implements ToolRegistry {
    #private;
    constructor(context: ModelContext);
    list(): RegisteredTool[];
    get(name: string): RegisteredTool | undefined;
    has(name: string): boolean;
    invoke(name: string, input?: object): Promise<unknown>;
}
