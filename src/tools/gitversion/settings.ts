import { ISettingsProvider } from '@tools/common'
import { ExecuteFields, GitVersionSettings } from './models'
import { SettingsProvider } from '../common/settings'

export interface IGitVersionSettingsProvider extends ISettingsProvider {
    getGitVersionSettings(): GitVersionSettings
}

export class GitVersionSettingsProvider extends SettingsProvider implements IGitVersionSettingsProvider {
    getGitVersionSettings(): GitVersionSettings {
        const targetPath = this.buildAgent.getInput(ExecuteFields.targetPath)

        const useConfigFile = this.buildAgent.getBooleanInput(ExecuteFields.useConfigFile)
        const configFilePath = this.buildAgent.getInput(ExecuteFields.configFilePath)

        const updateAssemblyInfo = this.buildAgent.getBooleanInput(ExecuteFields.updateAssemblyInfo)
        const updateAssemblyInfoFilename = this.buildAgent.getInput(ExecuteFields.updateAssemblyInfoFilename)

        const additionalArguments = this.buildAgent.getInput(ExecuteFields.additionalArguments)

        const srcDir = this.buildAgent.sourceDir?.replace(/\\/g, '/')

        return {
            targetPath,
            useConfigFile,
            configFilePath,
            updateAssemblyInfo,
            updateAssemblyInfoFilename,
            additionalArguments,
            srcDir
        }
    }
}
