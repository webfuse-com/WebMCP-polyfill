import { type ModelContextClient } from "./ModelContextClient.ts";
export type UserInteractionCallback = () => Promise<unknown> | unknown;
export type ToolExecuteCallback = (input: object, client: ModelContextClient) => Promise<unknown> | unknown;
export interface ToolAnnotations {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
}
export interface ModelContextTool {
    name: string;
    description: string;
    execute: ToolExecuteCallback;
    title?: string;
    inputSchema?: object;
    annotations?: ToolAnnotations;
}
export interface ModelContextRegisterToolOptions {
    signal?: AbortSignal;
}
export interface ToolDefinition {
    name: string;
    title: string | null;
    description: string;
    inputSchema: string;
    execute: ToolExecuteCallback;
    readOnlyHint: boolean;
    untrustedContentHint: boolean;
}
export interface RegisteredTool {
    name: string;
    title: string | null;
    description: string;
    inputSchema: string;
    readOnlyHint: boolean;
    untrustedContentHint: boolean;
}
export interface ToolRegistry {
    list(): RegisteredTool[];
    set(tool: ModelContextTool): void;
    get(name: string): RegisteredTool | undefined;
    has(name: string): boolean;
    delete(name: string): void;
    invoke(name: string, input?: object): Promise<unknown>;
}
