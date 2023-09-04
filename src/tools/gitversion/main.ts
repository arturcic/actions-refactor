/// <reference types="vite/client" />
import { parseArgs } from 'node:util';


const {
    values: { name, cool },
} = parseArgs({
    options: {
        name: { type: 'string', short: 'n' },
        cool: { type: 'boolean', short: 'c' },
    },
});

const mode = import.meta.env.MODE;

let agent: typeof import('@agents/azure') | typeof import('@agents/github');
if (mode === 'azure') {
    agent = await import('@agents/azure');
} else /*if (mode === 'github')*/ {
    agent = await import('@agents/github');
}

console.log('Mode: ' + mode);

console.log(`${name} is ${cool ? 'cool' : 'not cool'}`);
console.log('Hello from agent: ' + agent.BuildAgent.name);

export {};
