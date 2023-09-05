export enum SetupFields {
    includePrerelease = 'includePrerelease',
    versionSpec = 'versionSpec',
    ignoreFailedSources = 'ignoreFailedSources',
    preferLatestVersion = 'preferLatestVersion'
}

export interface IBuildAgent {
    agentName: string;

    debug(message: string): void;

    getSourceDir(): string;

    getInput(input: string, required?: boolean): string;

    getListInput(input: string, required?: boolean): string[];

    getBooleanInput(input: string, required?: boolean): boolean;
}

export interface CliArgs {
    command: string | undefined;
}

export interface ISetupSettings {
    [SetupFields.versionSpec]: string;
    [SetupFields.includePrerelease]: boolean;
    [SetupFields.ignoreFailedSources]: boolean;
    [SetupFields.preferLatestVersion]: boolean;
}

export interface ISettingsProvider {
    getSetupSettings(): ISetupSettings;
}