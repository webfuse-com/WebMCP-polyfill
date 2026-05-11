import { type UserInteractionCallback } from "./types.ts";
export declare class ModelContextClient {
    requestUserInteraction(callback: UserInteractionCallback): Promise<unknown>;
}
