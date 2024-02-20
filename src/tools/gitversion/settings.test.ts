import { describe, expect, it } from 'vitest'
import { IBuildAgent } from '@agents/common'
import { GitVersionSettings } from './models'
import { GitVersionSettingsProvider } from './settings'

describe('GitVersion settings', () => {
    it('should return GitVersionSettings', () => {
        const settings = {
            targetPath: 'path',
            useConfigFile: true,
            configFilePath: 'path',
            updateAssemblyInfo: true,
            updateAssemblyInfoFilename: 'path',
            additionalArguments: 'args',
            srcDir: 'path'
        } as GitVersionSettings

        const buildAgent = {
            sourceDir: settings.srcDir,
            getInput: (input: keyof GitVersionSettings) => settings[input] as string,
            getBooleanInput: (input: keyof GitVersionSettings) => settings[input] as boolean
        } as IBuildAgent

        const settingsProvider = new GitVersionSettingsProvider(buildAgent)

        const gitVersionSettings = settingsProvider.getGitVersionSettings()

        expect(gitVersionSettings.targetPath).toBe(settings.targetPath)
        expect(gitVersionSettings.useConfigFile).toBe(settings.useConfigFile)
        expect(gitVersionSettings.configFilePath).toBe(settings.configFilePath)
        expect(gitVersionSettings.updateAssemblyInfo).toBe(settings.updateAssemblyInfo)
        expect(gitVersionSettings.updateAssemblyInfoFilename).toBe(settings.updateAssemblyInfoFilename)
        expect(gitVersionSettings.additionalArguments).toBe(settings.additionalArguments)
        expect(gitVersionSettings.srcDir).toBe(settings.srcDir)
    })
})
