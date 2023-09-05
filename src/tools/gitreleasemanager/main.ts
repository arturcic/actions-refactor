import { getAgent } from '@agents/common';
import { parseCliArgs } from '@tools/common';

const { BuildAgent: { name: agentName } } = await getAgent();
const { command } = parseCliArgs();

console.log(`[GitReleaseManager] runs ${command} on ${agentName}`);
