import { describe, it } from "node:test";
import { ok, equal, deepEqual, throws, doesNotThrow, rejects } from "node:assert/strict";

import { type ModelContextTool } from "../src/types.ts";
import { ModelContext } from "../src/ModelContext.ts";
import { ModelContextClient } from "../src/ModelContextClient.ts";
import { ToolRegistry } from "../src/ToolRegistry.ts";


function createContext() {
    const registry = new ToolRegistry();

    return {
        context: new ModelContext(registry),
        registry
    };
}

function defineDummyTool(overrides: Partial<ModelContextTool> = {}): ModelContextTool {
    return {
        name: "do_something",
        description: "Does something.",
        execute: async () => "done",

        ...overrides
    };
}


describe("ModelContext.registerTool (success)", () => {
    it("Registers a tool and exposes it via the registry", () => {
        const { context, registry } = createContext();

        context.registerTool(defineDummyTool());

        equal(registry.__has("do_something"), true);
        equal(registry.listTools().length, 1);
        equal(registry.__get("do_something")?.name, "do_something");
    });

    it("Stores description verbatim", () => {
        const { context, registry } = createContext();

        context.registerTool(defineDummyTool({ description: "verbatim description" }));

        equal(registry.__get("do_something")?.description, "verbatim description");
    });

    it("Captures title when provided, null otherwise", () => {
        const { context, registry } = createContext();

        context.registerTool(defineDummyTool({ name: "foo", title: "'foo' is a metasyntactic variable" }));
        context.registerTool(defineDummyTool({ name: "bar" }));

        equal(registry.__get("foo")?.title, "'foo' is a metasyntactic variable");
        equal(registry.__get("bar")?.title, null);
    });

    it("Stringifies input schema", () => {
        const { context, registry } = createContext();

        const schema = {
            type: "object",
            properties: { msg: { type: "string" } },
            required: [ "msg" ]
        };

        context.registerTool(defineDummyTool({ inputSchema: schema }));

        const stored = registry.__get("do_something")!.inputSchema;

        equal(typeof stored, "string");
        deepEqual(JSON.parse(stored), schema);
    });

    it("Defaults input schema to empty string", () => {
        const { context, registry } = createContext();

        context.registerTool(defineDummyTool());

        equal(registry.__get("do_something")?.inputSchema, "");
    });

    it("Captures annotation hints, defaulting to false", () => {
        const { context, registry } = createContext();

        context.registerTool(
            defineDummyTool({
                name: "readonly",
                annotations: { readOnlyHint: true, untrustedContentHint: true }
            })
        );
        context.registerTool(defineDummyTool({ name: "plain" }));

        const ro = registry.__get("readonly")!;
        const plain = registry.__get("plain")!;

        equal(ro.readOnlyHint, true);
        equal(ro.untrustedContentHint, true);
        equal(plain.readOnlyHint, false);
        equal(plain.untrustedContentHint, false);
    });

    it("Accepts all valid names", () => {
        const { context } = createContext();

        for(const name of [
            "a", "A1", "with_underscore", "with-dash", "with.dot", "a".repeat(128)
        ]) {
            doesNotThrow(
                () => context.registerTool(defineDummyTool({ name })),
                `expected name "${name}" to be valid`
            );
        }
    });
});

describe("ModelContext.registerTool (failure: validation)", () => {
    it("Throws on duplicate name", () => {
        const { context } = createContext();

        context.registerTool(defineDummyTool());

        throws(
            () => context.registerTool(defineDummyTool()),
            (e: any) => e?.name === "InvalidStateError"
        );
    });

    it("Throws on empty name", () => {
        const { context } = createContext();

        throws(
            () => context.registerTool(defineDummyTool({ name: "" })),
            (e: any) => e?.name === "InvalidStateError"
        );
    });

    it("Throws on empty description", () => {
        const { context } = createContext();

        throws(
            () => context.registerTool(defineDummyTool({ description: "" })),
            (e: any) => e?.name === "InvalidStateError"
        );
    });

    it("Throws on invalid name", () => {
        const { context } = createContext();

        for(const bad of [
            "has space", "has🙂", "has/slash", "has,comma"
        ]) {
            throws(
                () => context.registerTool(defineDummyTool({ name: bad })),
                (e: any) => e?.name === "InvalidStateError",
                `expected name "${bad}" to be rejected`
            );
        }
    });

    it("Throws on excessive name", () => {
        const { context } = createContext();

        throws(
            () => context.registerTool(defineDummyTool({ name: "a".repeat(129) })),
            (e: any) => e?.name === "InvalidStateError"
        );
    });

    it("Throws when input schema serializes to undefined", () => {
        const { context } = createContext();
        const schema: any = { toJSON() { return undefined; } };

        throws(
            () => context.registerTool(defineDummyTool({ inputSchema: schema })),
            TypeError
        );
    });

    it("Re-throws on circular input schema", () => {
        const { context } = createContext();
        const circ: any = {};

        circ.self = circ;

        throws(
            () => context.registerTool(defineDummyTool({ inputSchema: circ })),
            TypeError
        );
    });

    it("Does not validate execute callable upfront (trusts caller)", () => {
        const { context, registry } = createContext();

        doesNotThrow(() =>
            context.registerTool({
                name: "foo",
                description: "'foo' is a metasyntactic variable",
                execute: "non-function" as any
            })
        );
        equal(registry.__has("foo"), true);
    });
});

describe("ModelContext.registerTool (failure: abort signal)", () => {
    it("Unregisters tool when signal aborts after registration", () => {
        const { context, registry } = createContext();
        const ac = new AbortController();

        context.registerTool(defineDummyTool(), { signal: ac.signal });

        equal(registry.__has("do_something"), true);

        ac.abort();

        equal(registry.__has("do_something"), false);
    });

    it("Does not register when signal is already aborted", () => {
        const { context, registry } = createContext();
        const ac = new AbortController();

        ac.abort();

        context.registerTool(defineDummyTool(), { signal: ac.signal });

        equal(registry.__has("do_something"), false);
    });

    it("Does not affect other tools when one signal aborts", () => {
        const { context, registry } = createContext();
        const ac = new AbortController();

        context.registerTool(defineDummyTool({ name: "transient" }), { signal: ac.signal });
        context.registerTool(defineDummyTool({ name: "permanent" }));

        ac.abort();

        equal(registry.__has("transient"), false);
        equal(registry.__has("permanent"), true);
    });

    it("Allows the same name to be re-registered after abort", () => {
        const { context, registry } = createContext();
        const ac = new AbortController();

        context.registerTool(defineDummyTool(), { signal: ac.signal });

        ac.abort();

        doesNotThrow(() => context.registerTool(defineDummyTool()));
        equal(registry.__has("do_something"), true);
    });
});

describe("ToolRegistry", () => {
    it("list() reflects current registry", () => {
        const { context, registry } = createContext();

        equal(registry.listTools().length, 0);

        context.registerTool(defineDummyTool({ name: "foo" }));
        context.registerTool(defineDummyTool({ name: "bar" }));

        equal(registry.listTools().length, 2);

        deepEqual(
            registry.listTools().map(t => t.name),
            [ "foo", "bar" ]
        );
    });

    it("get() returns undefined for unknown tools", () => {
        const { registry } = createContext();

        equal(registry.__get("nope"), undefined);
    });

    it("executeTool() forwards input verbatim and returns the result", async () => {
        const { context, registry } = createContext();
        context.registerTool({
            name: "echo",
            description: "echoes",
            execute: async (input: any) => ({ got: input.msg })
        });

        const result: any = await registry.executeTool("echo", { msg: "ping" });

        deepEqual(result, { got: "ping" });

        const resultStr: any = await registry.executeTool("echo", JSON.stringify({ msg: "ping" }));

        deepEqual(resultStr, { got: "ping" });
    });

    it("executeTool() defaults input to {}", async () => {
        const { context, registry } = createContext();

        context.registerTool({
            name: "no_arguments",
            description: "This tool has no arguments",
            execute: async (input: any) => Object.keys(input).length
        });

        equal(await registry.executeTool("no_arguments"), 0);
    });

    it("executeTool() awaits synchronous return values, too", async () => {
        const { context, registry } = createContext();

        context.registerTool({
            name: "sync",
            description: "This tool executes synchronously",
            execute: () => 2026
        });

        const result = await registry.executeTool("sync");

        equal(result, 2026);
    });

    it("executeTool() rejects when the tool is missing", async () => {
        const { registry } = createContext();

        await rejects(() => registry.executeTool("missing"), /is not registered/);
    });

    it("executeTool() propagates errors thrown by execute()", async () => {
        const { context, registry } = createContext();

        context.registerTool({
            name: "throws",
            description: "This tool throws an error",
            execute: async () => { throw new Error("Bad error"); }
        });

        await rejects(() => registry.executeTool("throws"), /Bad error/);
    });

    it("executeTool() passes context as second argument", async () => {
        const { context, registry } = createContext();

        let received: unknown = null;

        context.registerTool({
            name: "introspect",
            description: "This tool introspects its passed context",
            execute: async (_input, client) => {
                received = client;

                return null;
            }
        });

        await registry.executeTool("introspect");

        ok(received instanceof ModelContextClient);
    });

    it("list() detaches snapshots from internal state", () => {
        const { context, registry } = createContext();

        context.registerTool(defineDummyTool({ description: "original" }));

        const snap = registry.__get("do_something")!;

        snap.description = "mutated";

        // Re-fetching should give the original
        equal(registry.__get("do_something")?.description, "original");
    });
});

describe("Registry (direct usage)", () => {
    it("set() registers a tool directly", () => {
        const registry = new ToolRegistry();

        registry.__set(defineDummyTool());

        equal(registry.__has("do_something"), true);
        equal(registry.__get("do_something")?.name, "do_something");
    });

    it("set() validates the same as ModelContext.registerTool", () => {
        const registry = new ToolRegistry();

        throws(
            () => registry.__set(defineDummyTool({ name: "" })),
            (e: any) => e?.name === "InvalidStateError"
        );

        registry.__set(defineDummyTool());
        throws(
            () => registry.__set(defineDummyTool()),
            (e: any) => e?.name === "InvalidStateError"
        );
    });

    it("delete() unregisters a tool", () => {
        const registry = new ToolRegistry();

        registry.__set(defineDummyTool());
        registry.__delete("do_something");

        equal(registry.__has("do_something"), false);
    });

    it("delete() is a no-op for unknown tools", () => {
        const registry = new ToolRegistry();

        doesNotThrow(() => registry.__delete("never_existed"));
    });
});

describe("ModelContextClient.requestUserInteraction", () => {
    it("Awaits callback and resolves with result", async () => {
        const client = new ModelContextClient();
        const result = await client.requestUserInteraction(async () => "yes");

        equal(result, "yes");
    });

    it("Supports synchronous callbacks, too", async () => {
        const client = new ModelContextClient();
        const result = await client.requestUserInteraction(() => 123);

        equal(result, 123);
    });

    it("Rejects when callback is not a function", async () => {
        const client = new ModelContextClient();

        await rejects(
            () => client.requestUserInteraction("nope" as any),
            TypeError
        );
    });

    it("Is reachable from inside a tool's execute()", async () => {
        const { context, registry } = createContext();

        context.registerTool({
            name: "ask_user",
            description: "This tool asks for user interaction",
            execute: async (_input, client) =>
                await client.requestUserInteraction(async () => "yes")
        });

        equal(await registry.executeTool("ask_user"), "yes");
    });
});