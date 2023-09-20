import { ISettingsProvider, ISetupSettings, SetupFields } from './models'
import { IBuildAgent } from '@agents/common'

export class SettingsProvider implements ISettingsProvider {
    constructor(protected buildAgent: IBuildAgent) {}

    getSetupSettings(): ISetupSettings {
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
