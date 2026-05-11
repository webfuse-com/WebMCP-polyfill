import { type ToolDefinition, type RegisteredTool, type ToolRegistry, type ModelContextTool } from "./types.ts";
import { ModelContextClient } from "./ModelContextClient.ts";


const TOOL_NAME_REGEX: RegExp = /^[A-Za-z0-9_\-.]+$/;


export class Registry implements ToolRegistry {
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

    static #snapshotToolDefinition(toolDefinition: ToolDefinition): RegisteredTool {
        const {
            execute,
            ...rest
        } = toolDefinition;

        return rest;
    }

    readonly #toolMap: Map<string, ToolDefinition> = new Map();

    public list(): RegisteredTool[] {
        const toolDefinitionSnapshots: RegisteredTool[] = [];

        for(const toolDefinition of this.#toolMap.values()) {
            toolDefinitionSnapshots
                .push(Registry.#snapshotToolDefinition(toolDefinition));
        }

        return toolDefinitionSnapshots;
    }

    public setUnsafe(tool: ModelContextTool) {
        let serializedInputSchema: string = "";
        if(tool.inputSchema !== undefined) {
            serializedInputSchema = JSON.stringify(tool.inputSchema);

            if(serializedInputSchema === undefined) {
                throw new TypeError(
                    "Tool input schema serialized to undefined"
                );
            }
        }

        const readOnlyHint: boolean = !!(tool.annotations && tool.annotations.readOnlyHint);
        const untrustedContentHint: boolean = !!(tool.annotations && tool.annotations.untrustedContentHint);

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

    public set(tool: ModelContextTool) {
        if(
            (typeof(tool.name) !== "string")
            || (tool.name.length === 0)
        ) {
            Registry.throwDOMException(
                "InvalidStateError",
                "Tool name must be a non-empty string"
            );
        }
        if(
            (typeof(tool.description) !== "string")
            || (tool.description.length === 0)
        ) {
            Registry.throwDOMException(
                "InvalidStateError",
                "Tool description must be a non-empty string"
            );
        }
        if(this.#toolMap.has(tool.name)) {
            Registry.throwDOMException(
                "InvalidStateError",
                `Tool named '${tool.name}' is already registered`
            );
        }
        if(!Registry.isValidToolName(tool.name)) {
            Registry.throwDOMException(
                "InvalidStateError",
                `Invalid tool name '${tool.name}' (must only use 1-128 ASCII alphanumeric characters, '_', '-', or '.'`
            );
        }

        this.setUnsafe(tool);
    }
 
    public get(name: string): RegisteredTool | undefined {
        const toolDefinition: ToolDefinition | undefined = this.#toolMap.get(name);

        return toolDefinition
            ? Registry.#snapshotToolDefinition(toolDefinition)
            : undefined;
    }

    public has(name: string): boolean {
        return this.#toolMap.has(name);
    }

    public delete(name: string): void {
        this.#toolMap.delete(name);
    }

    public async invoke(name: string, input: object = {}): Promise<unknown> {
        const toolDefinition: ToolDefinition | undefined = this.#toolMap.get(name);

        if(!toolDefinition) throw new Error(`Registry: no tool named '${name}' is registered.`);

        return toolDefinition.execute(input, new ModelContextClient());
    }
}