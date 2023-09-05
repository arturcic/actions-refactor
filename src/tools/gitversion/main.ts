import { getAgent } from '@agents/common';
import { isExplicitVersion, parseCliArgs } from '@tools/common';

const { BuildAgent: { name: agentName } } = await getAgent();
const { command } = parseCliArgs();

console.log(`[GitVersion] runs ${command} on ${agentName}`);

const response = await fetch('https://azuresearch-usnc.nuget.org/query?q=GitVersion.Tool&semVerLevel=2.0.0&take=1');

if (!response.ok) {
    console.error(`[GitVersion] failed to query nuget.org: ${response.statusText}`);
}
console.log(await response.json());
console.log('isExplicit: 1.2.3' + isExplicitVersion('1.2.x'));
