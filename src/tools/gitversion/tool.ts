import { DotnetTool, IBuildAgent } from '@tools/common';
import { GitVersionSettingsProvider, IGitVersionSettingsProvider } from './settings.ts';

export class GitVersionTool extends DotnetTool {

    constructor(buildAgent: IBuildAgent) {
        super(buildAgent);
    }

    public get toolName(): string {
        return 'GitVersion.Tool';
    }

    get settingsProvider(): IGitVersionSettingsProvider {
        return new GitVersionSettingsProvider(this.buildAgent);
    }

    async run() {
        const setupSettings = this.settingsProvider.getGitVersionSettings();
        this.buildAgent.debug('toolRun' + ' ' + this.toolName + ' ' + setupSettings.targetPath);
    }
}