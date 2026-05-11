import { type ModelContextRegisterToolOptions, type ModelContextTool } from "./types.ts";
import { ModelContext } from "./ModelContext.ts";
import { ModelContextClient } from "./ModelContextClient.ts";
import { Registry } from "./Registry.ts";


const NON_SPEC_REGISTRY_IDENTIFIER: string = "WebMCP";


declare global {
    interface Navigator {
        readonly modelContext: ModelContext;
    }
    interface Window {
        ModelContext: typeof ModelContext;
        ModelContextClient: typeof ModelContextClient;
    }
}


const registry = new Registry();

// NON-SPEC:

Object.defineProperty(window, NON_SPEC_REGISTRY_IDENTIFIER, {
    value: registry,
    writable: false,
    enumerable: false,
    configurable: false
});


if(!("modelContext" in navigator)) {
    const modelContext = new ModelContext(registry);

    // SPEC:

    Object.defineProperty(window.navigator, "modelContext", {
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

    const nativeModelContext: ModelContext = navigator.modelContext;
    const nativeRegisterTool = nativeModelContext.registerTool
        .bind(navigator.modelContext);
 
    Object.defineProperty(nativeModelContext, "registerTool", {
        value: function(tool: ModelContextTool, options: ModelContextRegisterToolOptions = {}) {
            nativeRegisterTool(tool, options);
 
            if(options.signal?.aborted) return;
 
            try {
                registry.setUnsafe(tool);
            } catch {
                // Ignore deep errors.
            }
 
            if(options.signal) {
                options.signal.addEventListener(
                    "abort",
                    () => registry.delete(tool.name),
                    { once: true }
                );
            }
        },
        writable: false,
        enumerable: true,
        configurable: false
    });
}