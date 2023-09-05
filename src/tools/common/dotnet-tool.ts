import { IBuildAgent, ISettingsProvider } from './models.ts';

export interface IDotnetTool {
    get toolName(): string;

    disableTelemetry(): void;

    install(): Promise<string>;
}

export abstract class DotnetTool implements IDotnetTool {

    protected constructor(protected buildAgent: IBuildAgent) {
    }

    abstract get settingsProvider(): ISettingsProvider;
    abstract get toolName(): string;

    public disableTelemetry(): void {
        this.buildAgent.debug('disableTelemetry');
    }

    public install(): Promise<string> {
        const setupSettings = this.settingsProvider.getSetupSettings();

        this.buildAgent.debug('toolInstall' + ' ' + this.toolName + ' ' + setupSettings.versionSpec);
        return Promise.resolve('toolInstall');
    }
}