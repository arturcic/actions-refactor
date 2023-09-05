import { DotnetTool, IBuildAgent, ISettingsProvider } from '@tools/common';
import { GitVersionSettingsProvider } from './settings.ts';

export class GitVersionTool extends DotnetTool {

    constructor(buildAgent: IBuildAgent) {
        super(buildAgent);
    }

    public get toolName(): string {
        return 'GitVersion.Tool';
    }

    get settingsProvider(): ISettingsProvider {
        return new GitVersionSettingsProvider(this.buildAgent);
    }
}