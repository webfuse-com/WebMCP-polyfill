import { type ModelContextRegisterToolOptions, type ModelContextTool } from "./types.ts";
import { ModelContext } from "./ModelContext.ts";
import { ModelContextClient } from "./ModelContextClient.ts";
import { ToolRegistry } from "./ToolRegistry.ts";


const NON_SPEC_REGISTRY_IDENTIFIER: string = "modelContextTesting";


declare global {
    interface Document {
        readonly modelContext: ModelContext;
    }
    interface Window {
        ModelContext: typeof ModelContext;
        ModelContextClient: typeof ModelContextClient;
    }
}


// NON-SPEC:

if(!(NON_SPEC_REGISTRY_IDENTIFIER in navigator)) {
    const registry = new ToolRegistry();

    Object.defineProperty(navigator, NON_SPEC_REGISTRY_IDENTIFIER, {
        value: registry,
        writable: false,
        enumerable: false,
        configurable: false
    });

    if(!("modelContext" in document)) {
        const modelContext = new ModelContext(registry);

        // SPEC:

        Object.defineProperty(document, "modelContext", {
            value: modelContext,
            writable: false,
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(window, "ModelContext", {
            value: ModelContext,
            writable: false,
            enumerable: false,
            configurable: false
        });
        Object.defineProperty(window, "ModelContextClient", {
            value: ModelContextClient,
            writable: false,
            enumerable: false,
            configurable: false
        });
    } else {
        // Navigator natively supports WebMCP.
        // Wrap 'registerTool()' so the non-spec registry (polyfill) still observes it.
        // Skip extensive checks, but mirror native result.

        const nativeModelContext: ModelContext = document.modelContext;

        if(Object.getOwnPropertyDescriptor(nativeModelContext, "registerTool")?.configurable === false) {
            const nativeRegisterTool = nativeModelContext.registerTool
                .bind(document.modelContext);
        
            Object.defineProperty(nativeModelContext, "registerTool", {
                value: function(tool: ModelContextTool, options: ModelContextRegisterToolOptions = {}) {
                    // Native 'registerTool()' now returns a promise; forward it verbatim.
                    const nativeResult = nativeRegisterTool(tool, options);

                    if(options.signal?.aborted) return nativeResult;

                    try {
                        registry.__setUnsafe(tool);
                    } catch {
                        // Ignore deep errors
                    }

                    if(options.signal) {
                        options.signal.addEventListener(
                            "abort",
                            () => registry.__delete(tool.name),
                            { once: true }
                        );
                    }

                    return nativeResult;
                },
                writable: false,
                enumerable: true,
                configurable: false
            });
        }
    }
}