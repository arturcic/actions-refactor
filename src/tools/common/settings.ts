import { IBuildAgent } from '@agents/common'
import { ISettingsProvider, SetupSettings, SetupFields } from './models'

export class SettingsProvider implements ISettingsProvider {
    constructor(protected buildAgent: IBuildAgent) {}

    getSetupSettings(): SetupSettings {
        const versionSpec = this.buildAgent.getInput(SetupFields.versionSpec)
        const includePrerelease = this.buildAgent.getBooleanInput(SetupFields.includePrerelease)
        const ignoreFailedSources = this.buildAgent.getBooleanInput(SetupFields.ignoreFailedSources)
        const preferLatestVersion = this.buildAgent.getBooleanInput(SetupFields.preferLatestVersion)

        return {
            versionSpec,
            includePrerelease,
            ignoreFailedSources,
            preferLatestVersion
        }
    }
}
