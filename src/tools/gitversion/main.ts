/// <reference types="vite/client" />
import { parseArgs } from 'node:util';
import { Agent, getAgent } from '@agents/common';

const {
    values: { name, cool },
} = parseArgs({
    options: {
        name: { type: 'string', short: 'n' },
        cool: { type: 'boolean', short: 'c' },
    },
});

let agent: Agent = await getAgent();

console.log(`${name} is ${cool ? 'cool' : 'not cool'}`);
console.log('[GitVersion] Hello from agent: ' + agent.BuildAgent.name);

export {};
