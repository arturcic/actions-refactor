export enum SetupFields {
    includePrerelease = 'includePrerelease',
    versionSpec = 'versionSpec',
    ignoreFailedSources = 'ignoreFailedSources',
    preferLatestVersion = 'preferLatestVersion'
}

export interface CliArgs {
    command: string
    buildAgent: string
}

export interface SetupSettings {
    [SetupFields.versionSpec]: string
    [SetupFields.includePrerelease]: boolean
    [SetupFields.ignoreFailedSources]: boolean
    [SetupFields.preferLatestVersion]: boolean
}

export interface ISettingsProvider {
    getSetupSettings(): SetupSettings
}
