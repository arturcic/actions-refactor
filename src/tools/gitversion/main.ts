import {parseArgs} from "node:util";

const {
    values: {name, cool},
} = parseArgs({
    options: {
        name: {
            type: "string",
            short: "n",
        },
        cool: {
            type: "boolean",
            short: "c",
        },
    },
});

const agent = await import('@agents/azure')

console.log(`${name} is ${cool ? "cool" : "not cool"}`);
console.log('Hello from agent: ' + agent.BuildAgent.name)

export {}
