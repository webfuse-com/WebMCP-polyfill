import { type UserInteractionCallback } from "./types.js";


export class ModelContextClient {
    async requestUserInteraction(callback: UserInteractionCallback): Promise<unknown> {
        return await callback();
    }
}