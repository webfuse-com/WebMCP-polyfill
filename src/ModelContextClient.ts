export class ModelContextClient {
    async requestUserInteraction(cb: () => unknown | Promise<unknown>): Promise<unknown> {
        return await cb();
    }
}