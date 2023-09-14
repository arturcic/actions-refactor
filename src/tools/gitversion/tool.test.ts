import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IBuildAgent, ISetupSettings } from '@tools/common'
import { GitVersionTool } from './tool'
import { GitVersionSettingsProvider } from './settings'

const businessHours = [9, 17]

function purchase(): { message: string } {
    const currentHour = new Date().getHours()
    const [open, close] = businessHours

    if (currentHour > open && currentHour < close) return { message: 'Success' }

    return { message: 'Error' }
}

describe('purchasing flow', () => {
    beforeEach(() => {
        // tell vitest we use mocked time
        vi.useFakeTimers()
    })

    afterEach(() => {
        // restoring date after each test run
        vi.useRealTimers()
    })

    it('some test', async () => {
        const settings: ISetupSettings = {
            versionSpec: '5.x',
            includePrerelease: false,
            ignoreFailedSources: true,
            preferLatestVersion: false
        }

        const buildAgent = {
            debug: (message: string) => console.log(message),
            info: (message: string) => console.log(message),

            findLocalTool: (_toolName: string, _versionSpec: string, _arch?: string): string | null => null,

            getInput: (input: keyof ISetupSettings, _required?: boolean) => settings[input],
            getBooleanInput: (input: keyof ISetupSettings, _required?: boolean): boolean =>
                ((settings[input] as string) || '').toString().toUpperCase() === 'TRUE'
        } as IBuildAgent

        expect(buildAgent.getInput('versionSpec')).toBe(settings.versionSpec)
        expect(buildAgent.getBooleanInput('includePrerelease')).toBe(settings.includePrerelease)
        expect(buildAgent.getBooleanInput('ignoreFailedSources')).toBe(settings.ignoreFailedSources)
        expect(buildAgent.getBooleanInput('preferLatestVersion')).toBe(settings.preferLatestVersion)

        const provider = new GitVersionSettingsProvider(buildAgent)

        const setupSettings = provider.getSetupSettings()

        expect(setupSettings.versionSpec).toBe(settings.versionSpec)
        expect(setupSettings.includePrerelease).toBe(settings.includePrerelease)
        expect(setupSettings.ignoreFailedSources).toBe(settings.ignoreFailedSources)
        expect(setupSettings.preferLatestVersion).toBe(settings.preferLatestVersion)

        const tool = new GitVersionTool(buildAgent)
        const result = await tool.install()
        expect(result).toBe('toolInstall')
        /*const getApples = vi.fn(() => 0);

        getApples();

        vi.spyOn(getApples, 'callThrough');

        expect(getApples).toHaveBeenCalled();
        expect(getApples).toHaveReturnedWith(0);

        getApples
            .mockReturnValueOnce(5)
            .mockReturnValueOnce(4)
            .mockReturnValueOnce(2);

        expect(getApples()).toBe(5);
        expect(getApples()).toBe(4);
        expect(getApples()).toBe(2);
        expect(getApples).toHaveNthReturnedWith(2, 5);*/
    })

    it('allows purchases within business hours', () => {
        // set hour within business hours
        const date = new Date(2000, 1, 1, 13)
        vi.setSystemTime(date)

        // access Date.now() will result in the date set above
        expect(purchase()).toEqual({ message: 'Success' })
    })

    it('disallows purchases outside of business hours', () => {
        // set hour outside business hours
        const date = new Date(2000, 1, 1, 19)
        vi.setSystemTime(date)

        // access Date.now() will result in the date set above
        expect(purchase()).toEqual({ message: 'Error' })
    })
})
