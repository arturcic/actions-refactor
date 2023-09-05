import { IBuildAgent, ISetupSettings } from './models.ts';

export interface IDotnetTool {
    get toolName(): string;

    disableTelemetry(): void;

    install(setupSettings: ISetupSettings): Promise<string>;
}

export abstract class DotnetTool implements IDotnetTool {
    protected constructor(protected buildAgent: IBuildAgent) {
    }

    abstract get toolName(): string;

    public disableTelemetry(): void {
        this.buildAgent.debug('disableTelemetry');
    }

    public install(setupSettings: ISetupSettings): Promise<string> {
        this.buildAgent.debug('toolInstall' + ' ' + this.toolName + ' ' + setupSettings.versionSpec);
        return Promise.resolve('toolInstall');
    }
}