import { ModelContext } from "./ModelContext.ts";
import { ModelContextClient } from "./ModelContextClient.ts";
declare global {
    interface Navigator {
        readonly modelContext: ModelContext;
    }
    interface Window {
        ModelContext: typeof ModelContext;
        ModelContextClient: typeof ModelContextClient;
    }
}
