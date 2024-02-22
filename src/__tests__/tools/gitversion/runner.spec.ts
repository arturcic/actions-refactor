import * as process from 'node:process'
import * as path from 'node:path'
import * as fs from 'node:fs'
import * as os from 'node:os'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { IBuildAgent } from '@agents/common'
import { Runner } from '@tools/gitversion'
import { BuildAgent as LocalBuildAgent } from '@agents/local'
import { BuildAgent as GitHubActionsAgent } from '@agents/github'

describe('GitVersion Runner', () => {
    const baseDir = path.resolve(__dirname, '../../../../.test')
    const envName = process.platform === 'win32' ? 'Path' : 'PATH'
    const version = '5.12.0'
    const toolPath = path.resolve(baseDir, 'tools', 'GitVersion.Tool', version, os.arch())

    function setEnv(key: string, value: string): void {
        process.env[key.toUpperCase()] = value
    }

    function getEnv(key: string): string {
        return process.env[key] || ''
    }

    function setInputs(inputs: Record<string, string>): void {
        for (const key in inputs) {
            setEnv(`INPUT_${key}`, inputs[key])
        }
    }
    function testOnAgent(agent: IBuildAgent): void {
        function resetEnv(): void {
            process.env.PATH = process.env[envName] // workaround for windows
            setEnv('GITVERSION_PATH', '')
            setEnv(agent.sourceDirVariable, '')
            setEnv(agent.tempDirVariable, '')
            setEnv(agent.cacheDirVariable, '')

            setInputs({
                versionSpec: '',
                includePrerelease: '',
                ignoreFailedSources: '',
                preferLatestVersion: ''
            })
        }

        let runner!: Runner
        beforeEach(() => {
            runner = new Runner(agent)
            resetEnv()
            setEnv(agent.sourceDirVariable, path.resolve(baseDir))
            setEnv(agent.tempDirVariable, path.resolve(baseDir, 'temp'))
            setEnv(agent.cacheDirVariable, path.resolve(baseDir, 'tools'))
        })

        afterEach(() => {
            resetEnv()
        })

        it.sequential('should run setup GitVersion', async () => {
            setInputs({
                versionSpec: '5.12.x',
                includePrerelease: 'false',
                ignoreFailedSources: 'false',
                preferLatestVersion: 'false'
            })

            const exitCode = await runner.run('setup')

            expect(exitCode).toBe(0)
            expect(fs.existsSync(path.resolve(baseDir))).toBe(true)
            expect(fs.existsSync(path.resolve(baseDir, 'tools'))).toBe(true)
            expect(fs.existsSync(toolPath)).toBe(true)

            expect(getEnv('GITVERSION_PATH')).toBe(toolPath)

            const foundToolPath = await agent.which('dotnet-gitversion', true)
            expect(foundToolPath).contain(toolPath)
        })

        it.sequential('should execute GitVersion', async () => {
            setEnv('GITVERSION_PATH', toolPath)

            const exitCode = await runner.run('execute')

            expect(exitCode).toBe(0)

            expect(getEnv('GitVersion_Major')).toBeDefined()
            expect(getEnv('GitVersion_Minor')).toBeDefined()
            expect(getEnv('GitVersion_Patch')).toBeDefined()

            expect(getEnv('major')).toBeDefined()
            expect(getEnv('minor')).toBeDefined()
            expect(getEnv('patch')).toBeDefined()
        })
    }

    describe('Local Agent', () => {
        testOnAgent(new LocalBuildAgent())
    })

    describe('GitHub Actions Agent', () => {
        testOnAgent(new GitHubActionsAgent())
    })
})
