import * as process from 'node:process'
import * as path from 'node:path'
import * as fs from 'node:fs'
import * as os from 'node:os'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Runner } from '@tools/gitversion'
import { BuildAgent as LocalBuildAgent } from '@agents/local'

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

    function resetEnv(): void {
        setEnv('AGENT_SOURCE_DIR', '')
        setEnv('AGENT_TEMP_DIR', '')
        setEnv('AGENT_TOOLS_DIR', '')

        setInputs({
            versionSpec: '',
            includePrerelease: '',
            ignoreFailedSources: '',
            preferLatestVersion: ''
        })
    }

    beforeEach(() => {
        resetEnv()
        setEnv('AGENT_SOURCE_DIR', path.resolve(baseDir))
        setEnv('AGENT_TEMP_DIR', path.resolve(baseDir, 'temp'))
        setEnv('AGENT_TOOLS_DIR', path.resolve(baseDir, 'tools'))
    })

    afterEach(() => {
        resetEnv()
    })

    it('should run setup GitVersion', async () => {
        setInputs({
            versionSpec: '5.12.x',
            includePrerelease: 'false',
            ignoreFailedSources: 'false',
            preferLatestVersion: 'false'
        })

        const agent = new LocalBuildAgent()
        const runner = new Runner(agent)
        const exitCode = await runner.run('setup')

        expect(exitCode).toBe(0)
        expect(fs.existsSync(path.resolve(baseDir))).toBe(true)
        expect(fs.existsSync(path.resolve(baseDir, 'tools'))).toBe(true)
        expect(fs.existsSync(toolPath)).toBe(true)

        const foundToolPath = await agent.which('dotnet-gitversion', true)
        expect(foundToolPath).contain(toolPath)
    })

    it('should execute GitVersion', async () => {
        process.env[envName] = `${toolPath}${path.delimiter}${process.env[envName]}`

        const agent = new LocalBuildAgent()
        const runner = new Runner(agent)
        const exitCode = await runner.run('execute')

        expect(exitCode).toBe(0)

        expect(getEnv('GitVersion_Major')).toBeDefined()
        expect(getEnv('GitVersion_Minor')).toBeDefined()
        expect(getEnv('GitVersion_Patch')).toBeDefined()

        expect(getEnv('major')).toBeDefined()
        expect(getEnv('minor')).toBeDefined()
        expect(getEnv('patch')).toBeDefined()
    })
})
