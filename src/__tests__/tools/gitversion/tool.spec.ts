import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IBuildAgent } from '@agents/common'
import { GitVersionSettings, GitVersionTool } from '@tools/gitversion'

class TestGitVersionTool extends GitVersionTool {
    private _isValidInputFile = false

    init(isValidInputFile: boolean): void {
        this._isValidInputFile = isValidInputFile
    }

    isValidInputFile(): boolean {
        return this._isValidInputFile
    }

    getRepoDir(targetPath: string): string {
        return super.getRepoDir(targetPath)
    }

    getArguments(workDir: string, settings: GitVersionSettings): string[] {
        return super.getArguments(workDir, settings)
    }
}

describe('GitVersionTool', () => {
    let tool: TestGitVersionTool
    beforeEach(() => {
        tool = new TestGitVersionTool({} as IBuildAgent)
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it('should return correct tool name', () => {
        expect(tool.toolName).toBe('GitVersion.Tool')
    })

    it('should have settings provider defined', () => {
        expect(tool.settingsProvider).toBeDefined()
    })

    describe('getRepoDir', () => {
        it('should return correct repo dir for empty target path, takes build agent sourceDir', () => {
            const buildAgent = {
                sourceDir: 'workdir'
            } as IBuildAgent
            tool = new TestGitVersionTool(buildAgent)
            const repoDir = tool.getRepoDir('')
            expect(repoDir).toBe('workdir')
        })

        it('should return correct repo dir for empty target path, takes default', () => {
            const buildAgent = {
                sourceDir: ''
            } as IBuildAgent
            tool = new TestGitVersionTool(buildAgent)
            const repoDir = tool.getRepoDir('')
            expect(repoDir).toBe('.')
        })

        it('should return correct repo dir for existing target path', () => {
            const buildAgent = {
                dirExists(_file: string): boolean {
                    return true
                }
            } as IBuildAgent
            tool = new TestGitVersionTool(buildAgent)
            const repoDir = tool.getRepoDir('targetDir')
            expect(repoDir).toBe('targetDir')
        })

        it('should throw error for non-existing target path', () => {
            const wrongDir = 'wrongdir'
            const buildAgent = {
                dirExists(_file: string): boolean {
                    return false
                }
            } as IBuildAgent
            tool = new TestGitVersionTool(buildAgent)
            expect(() => tool.getRepoDir(wrongDir)).toThrowError(`Directory not found at ${wrongDir}`)
        })
    })

    describe('getArguments', () => {
        it('should return correct arguments for empty settings', () => {
            const args = tool.getArguments('workdir', {} as GitVersionSettings)
            expect(args).toEqual(['workdir', '/output', 'json', '/output', 'buildserver'])
        })

        it('should return correct arguments for settings with config', () => {
            tool.init(true)
            const args = tool.getArguments('workdir', {
                useConfigFile: true,
                configFilePath: 'workdir/GitVersion.yml'
            } as GitVersionSettings)
            expect(args).toEqual(['workdir', '/output', 'json', '/output', 'buildserver', '/config', 'workdir/GitVersion.yml'])
        })

        it('should return correct arguments for settings with wrong config file', () => {
            tool.init(false)
            const configFile = 'workdir/WrongConfig.yml'
            expect(() =>
                tool.getArguments('workdir', {
                    useConfigFile: true,
                    configFilePath: configFile
                } as GitVersionSettings)
            ).toThrowError(`GitVersion configuration file not found at ${configFile}`)
        })

        it('should return correct arguments for settings with assembly info', () => {
            tool.init(true)
            const args = tool.getArguments('workdir', {
                updateAssemblyInfo: true,
                updateAssemblyInfoFilename: 'AssemblyInfo.cs'
            } as GitVersionSettings)
            expect(args).toEqual(['workdir', '/output', 'json', '/output', 'buildserver', '/updateassemblyinfo', 'AssemblyInfo.cs'])
        })

        it('should return correct arguments for settings with wrong assembly info', () => {
            tool.init(false)
            const assemblyInfoFile = 'WrongAssemblyInfo.cs'
            expect(() =>
                tool.getArguments('workdir', {
                    updateAssemblyInfo: true,
                    updateAssemblyInfoFilename: assemblyInfoFile
                } as GitVersionSettings)
            ).toThrowError(`AssemblyInfoFilename file not found at ${assemblyInfoFile}`)
        })

        it('should return correct arguments for settings with config and assembly info', () => {
            tool.init(true)
            const args = tool.getArguments('workdir', {
                useConfigFile: true,
                configFilePath: 'workdir/GitVersion.yml',
                updateAssemblyInfo: true,
                updateAssemblyInfoFilename: 'AssemblyInfo.cs'
            } as GitVersionSettings)
            expect(args).toEqual([
                'workdir',
                '/output',
                'json',
                '/output',
                'buildserver',
                '/config',
                'workdir/GitVersion.yml',
                '/updateassemblyinfo',
                'AssemblyInfo.cs'
            ])
        })

        it('should return correct arguments for settings with additional arguments', () => {
            const args = tool.getArguments('workdir', {
                additionalArguments: '--some-arg --another-arg'
            } as GitVersionSettings)
            expect(args).toEqual(['workdir', '/output', 'json', '/output', 'buildserver', '--some-arg', '--another-arg'])
        })
    })
})
