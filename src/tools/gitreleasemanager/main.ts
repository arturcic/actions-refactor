import { Agent, getAgent } from '@agents/common';
import { parseCliArgs } from '@tools/common';

const agent: Agent = await getAgent();
const { command } = parseCliArgs();

console.log(`Command is ${command}`);
console.log('[GitReleaseManager] Hello from agent: ' + agent.BuildAgent.name);
