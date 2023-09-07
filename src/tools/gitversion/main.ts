import { getAgent } from '@agents/common';
import { parseCliArgs } from '@tools/common';
import { GitVersionTool } from './tool.ts';

const agent = await getAgent();

const gitVersionTool = new GitVersionTool(agent);

const { command } = parseCliArgs();
switch (command) {
    case 'setup':
        await setup();
        break;
    case 'execute':
        await run();
}

async function setup() {
    try {
        agent.info(`Running on: '${agent.agentName}'`);
        gitVersionTool.disableTelemetry();
        await gitVersionTool.install();
    } catch (error) {
        console.log(error);
    }
}

async function run() {
    try {
        agent.debug(`Agent: '${agent.agentName}'`);
        agent.debug('Disabling telemetry');
        gitVersionTool.disableTelemetry();

        agent.debug('Executing GitVersion');
        await gitVersionTool.run();
    } catch (error) {
        console.log(error);
    }
}
