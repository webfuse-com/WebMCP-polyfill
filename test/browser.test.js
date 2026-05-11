import { join } from "node:path";

import puppeteer from "puppeteer";


const ARGUMENTS = process.argv.slice(2);
const HEADLESS = !ARGUMENTS.includes("--no-headless");
const KEEPALIVE = ARGUMENTS.includes("--keepalive");


async function runBrowser(url, inPageCallback, options = {}) {
    const optionsWithDefaults = {
        viewport: [ 800, 600 ],
        headless: true,
        keepalive: false,

        ...options
    };

    const browser = await puppeteer.launch({
        args: [
            `--window-size=${optionsWithDefaults.viewport[0]},${optionsWithDefaults.viewport[1]}`,
            '--allow-file-access-from-files',
            '--disable-web-security'
        ],
        defaultViewport: null,
        headless: optionsWithDefaults.headless
    });

    const page = (await browser.pages())[0];

    page.on("domcontentloaded", async () => {
        await page.evaluate(inPageCallback);

        !optionsWithDefaults.keepalive
            && await browser.close();
    });

    await page.goto(url, {
        waitUntil: "load"
    });
}


await runBrowser(
    `file://${join(import.meta.dirname, "browser.test.html")}`,
    async () => {
        const objsEqual = (obj1, obj2) => {
            return JSON.stringify(obj1) === JSON.stringify(obj2);
        };
        const ok = (assertion, message) => {
            if(!assertion) throw new Error(message);
        };

        ok(
            objsEqual(
                WebMCP.list(),
                [
                    {
                        name: "get_products",
                        title: null,
                        description: "List all products in the current page.",
                        inputSchema: "",
                        readOnlyHint: true,
                        untrustedContentHint: false
                    },
                    {
                        name: "add_product_to_cart",
                        title: null,
                        description: "Add a product to the user's shopping cart.",
                        inputSchema: JSON.stringify({
                            type: "object",
                            properties: {
                                product_id: {
                                    type: "string"
                                }
                            },
                            required: [ "product_id" ]
                        }),
                        readOnlyHint: false,
                        untrustedContentHint: false
                    }
                ]
            ),
            "Invalid list for registered tools"
        );

        ok(WebMCP.has("get_products"), "Did not find 'get_products' tool in registry");
        ok(!WebMCP.has("unknown_tool"), "Did find never registered tool in registry");

        ok(
            objsEqual(
                WebMCP.get("get_products"),
                {
                    name: "get_products",
                    title: null,
                    description: "List all products in the current page.",
                    inputSchema: "",
                    readOnlyHint: true,
                    untrustedContentHint: false
                }
            ),
            "Invalid object getter 'get_products' tool"
        );

        ok(
            objsEqual(
                (await WebMCP.invoke("get_products"))[0],
                {
                    id: "170",
                    name: "Self-Lacing Sneakers"
                }
            ),
            "Invalid product (index 0) received via 'get_products' tool"
        );
        ok(
            objsEqual(
                await WebMCP.invoke("add_product_to_cart", { product_id: "172" }),
                {
                    ok: true,
                    product_id: "172"
                }
            ),
            "Invalid result adding product via 'add_product_to_cart'"
        );

        WebMCP.delete("get_products");
        ok(!WebMCP.has("get_products"), "Did still find 'get_products' tool in registry after de-registration");

        WebMCP.set({
            name: "unknown_tool",
            description: "Does something unpredictable.",
            execute() {
                return "Hello world!";
            }
        })
        ok(WebMCP.has("unknown_tool"), "Did still not find 'unknown_tool' tool in registry after registration");
        ok((await WebMCP.invoke("unknown_tool")) === "Hello world!", "Invalid result received via 'unknown_tool'");
    }, {
        headless: HEADLESS,
        keepalive: KEEPALIVE
    });