import { ModelContext } from "./ModelContext.js";
import { ModelContextClient } from "./ModelContextClient.js";
import { Registry } from "./Registry.js";


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


// SPEC:

const modelContext = new ModelContext();

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
    value: new Registry(modelContext),
    writable: false,
    enumerable: false,
    configurable: false
});