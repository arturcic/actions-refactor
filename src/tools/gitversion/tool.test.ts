import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IBuildAgent, ISetupSettings } from '@tools/common';
import { GitVersionTool } from './tool.ts';
import { GitVersionSettingsProvider } from './settings.ts';

const businessHours = [9, 17];

function purchase() {
    const currentHour = new Date().getHours();
    const [open, close] = businessHours;

    if (currentHour > open && currentHour < close)
        return { message: 'Success' };

    return { message: 'Error' };
}

describe('purchasing flow', () => {
    beforeEach(() => {
        // tell vitest we use mocked time
        vi.useFakeTimers();
    });

    afterEach(() => {
        // restoring date after each test run
        vi.useRealTimers();
    });

    it('some test', async () => {

        const settings: ISetupSettings = {
            versionSpec: '5.7.0',
            includePrerelease: false,
            ignoreFailedSources: true,
            preferLatestVersion: false
        };

        let buildAgent = {
            debug: (message: string) => console.log(message),
            getInput: (input: keyof ISetupSettings, _?: boolean) => settings[input],
            getBooleanInput: (input: keyof ISetupSettings, _?: boolean): boolean => (settings[input] as string || '').toString().toUpperCase() == 'TRUE',
        } as IBuildAgent;

        expect(buildAgent.getInput('versionSpec')).toBe('5.7.0');
        expect(buildAgent.getBooleanInput('includePrerelease')).toBe(false);
        expect(buildAgent.getBooleanInput('ignoreFailedSources')).toBe(true);
        expect(buildAgent.getBooleanInput('preferLatestVersion')).toBe(false);

        const provider = new GitVersionSettingsProvider(buildAgent);

        const setupSettings = provider.getSetupSettings();

        expect(setupSettings.versionSpec).toBe('5.7.0');
        expect(setupSettings.includePrerelease).toBe(false);
        expect(setupSettings.ignoreFailedSources).toBe(true);
        expect(setupSettings.preferLatestVersion).toBe(false);

        const tool = new GitVersionTool(buildAgent);
        const result = await tool.install();
        expect(result).toBe('toolInstall');
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
    });

    it('allows purchases within business hours', () => {
        // set hour within business hours
        const date = new Date(2000, 1, 1, 13);
        vi.setSystemTime(date);

        // access Date.now() will result in the date set above
        expect(purchase()).toEqual({ message: 'Success' });
    });

    it('disallows purchases outside of business hours', () => {
        // set hour outside business hours
        const date = new Date(2000, 1, 1, 19);
        vi.setSystemTime(date);

        // access Date.now() will result in the date set above
        expect(purchase()).toEqual({ message: 'Error' });
    });
});