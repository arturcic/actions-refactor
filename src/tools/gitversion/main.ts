import { getAgent } from '@agents/common';
import { parseCliArgs } from '@tools/common';
import { GitVersionTool } from './tool.ts';
import { GitVersionSettingsProvider } from './settings.ts';

const { command } = parseCliArgs();
const agent = await getAgent();

const settingsProvider = new GitVersionSettingsProvider(agent);
const gitVersionTool = new GitVersionTool(agent);

const settings = settingsProvider.getSetupSettings();
await gitVersionTool.install({
    ...settings,
    versionSpec: '5.7.0',
    includePrerelease: false,
    ignoreFailedSources: false,
    preferLatestVersion: false
});

agent.debug(`[GitVersion] runs ${command} on ${agent.agentName}`);

/*
switch (command) {
    case 'setup'
}*/
