import { describe, expect, it } from 'vitest'
import { IBuildAgent } from '@agents/common'
import { GitVersionSettings, GitVersionTool } from '@tools/gitversion'
class TestGitVersionTool extends GitVersionTool {
    getArguments(targetPath: string, settings: GitVersionSettings): string[] {
        return super.getArguments(targetPath, settings)
    }
}

describe('GitVersionTool', () => {
    it('should return correct tool name', () => {
        const tool = new TestGitVersionTool({} as IBuildAgent)
        expect(tool.toolName).toBe('GitVersion.Tool')
    })

    it('should have settings provider defined', () => {
        const tool = new TestGitVersionTool({} as IBuildAgent)
        expect(tool.settingsProvider).toBeDefined()
    })

    /*it('should return correct arguments', () => {
        const tool = new TestGitVersionTool({} as IBuildAgent)
        const args = tool.getArguments('path', {
            targetPath: 'path',
            useConfigFile: true,
            configFilePath: 'path',
            updateAssemblyInfo: true,
            updateAssemblyInfoFilename: 'path',
            additionalArguments: 'args'
        } as GitVersionSettings)

        expect(args).toEqual(['path', '/output', 'json', '/output', 'buildserver'])
    })*/
})
