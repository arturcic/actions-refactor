import * as process from 'node:process'
import * as path from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Runner } from '@tools/gitversion'
import { BuildAgent } from '@agents/local'
import * as fs from 'node:fs'
import * as os from 'node:os'

describe('GitVersion Runner', () => {
    const baseDir = path.resolve(__dirname, '../../../../.test')

    function setEnv(key: string, value: string): void {
        process.env[key.toUpperCase()] = value
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
    })

    afterEach(() => {
        resetEnv()
    })

    it('should run GitVersion', async () => {
        setEnv('AGENT_SOURCE_DIR', path.resolve(baseDir))
        setEnv('AGENT_TEMP_DIR', path.resolve(baseDir, '.temp'))
        setEnv('AGENT_TOOLS_DIR', path.resolve(baseDir, '.tools'))

        setInputs({
            versionSpec: '5.12.x',
            includePrerelease: 'false',
            ignoreFailedSources: 'false',
            preferLatestVersion: 'false'
        })

        const agent = new BuildAgent()
        const runner = new Runner(agent)
        await runner.execute('setup')

        expect(fs.existsSync(path.resolve(baseDir))).toBe(true)
        expect(fs.existsSync(path.resolve(baseDir, '.tools'))).toBe(true)
        expect(fs.existsSync(path.resolve(baseDir, '.tools', 'GitVersion.Tool', '5.12.0'))).toBe(true)

        const toolPath = await agent.which('GitVersion.Tool')
        expect(toolPath).toBe(path.resolve(baseDir, '.tools', 'GitVersion.Tool', '5.12.0', os.arch()))
    })
})
