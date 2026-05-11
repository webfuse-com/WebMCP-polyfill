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


// NON-SPEC:

Object.defineProperty(window, NON_SPEC_REGISTRY_IDENTIFIER, {
    value: registry,
    writable: false,
    enumerable: false,
    configurable: false
});