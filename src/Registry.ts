import { type ToolDefinition, type RegisteredTool, type ToolRegistry } from "./types.js";
import { ModelContext } from "./ModelContext.js";
import { ModelContextClient } from "./ModelContextClient.js";


export class Registry implements ToolRegistry {
    readonly #toolMap: Map<string, ToolDefinition>;

    constructor(context: ModelContext) {
        try {
            this.#toolMap = ModelContext.getInternalToolMap(context);
        } catch {
            throw new TypeError("Could not read from provided model context argument");
        }
    }

    static #snapshotToolDefinition(toolDefinition: ToolDefinition): RegisteredTool {
        const {
            execute,
            ...rest
        } = toolDefinition;

        return rest;
    }

    public list(): RegisteredTool[] {
        const toolDefinitionSnapshots: RegisteredTool[] = [];

        for(const toolDefinition of this.#toolMap.values()) {
            toolDefinitionSnapshots
                .push(Registry.#snapshotToolDefinition(toolDefinition));
        }

        return toolDefinitionSnapshots;
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

    public async invoke(name: string, input: object = {}): Promise<unknown> {
        const toolDefinition: ToolDefinition | undefined = this.#toolMap.get(name);
        if(!toolDefinition) throw new Error(`Registry: no tool named '${name}' is registered.`);

        return toolDefinition.execute(input, new ModelContextClient());
    }
}