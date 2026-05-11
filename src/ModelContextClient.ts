import { type UserInteractionCallback } from "./types.ts";


export class ModelContextClient {
    async requestUserInteraction(callback: UserInteractionCallback): Promise<unknown> {
        return await callback();
    }
}