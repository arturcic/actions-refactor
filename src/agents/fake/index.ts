import * as os from 'node:os'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as process from 'node:process'
import * as util from 'node:util'
import { exec as execNonPromise } from 'node:child_process'

import { lookPath } from './internal/lookPath'
import type { IBuildAgent, IExecResult } from '@agents/common'

export class BuildAgent implements IBuildAgent {
    get agentName(): string {
        return 'Local'
    }

    addPath(toolPath: string): void {
        const newPath = toolPath + path.delimiter + process.env['PATH']
        this.debug(`new Path: ${newPath}`)
        process.env['PATH'] = newPath
        this.info(`Updated PATH: ${process.env['PATH']}`)
    }

    debug(message: string): void {
        console.log(`[debug] ${message}`)
    }

    info(message: string): void {
        console.log(`[info] - ${message}`)
    }

    warn(message: string): void {
        console.warn(`[warn] - ${message}`)
    }

    error(message: string): void {
        console.error(`[error] - ${message}`)
    }

    async exec(cmd: string, args: string[]): Promise<IExecResult> {
        const exec = util.promisify(execNonPromise)

        try {
            const { stdout, stderr } = await exec(`${cmd} ${args.join(' ')}`)
            return Promise.resolve({
                code: 0,
                error: null,
                stderr,
                stdout
            })
        } catch (e) {
            const error = e as Error & { code: number; stderr: string; stdout: string }
            return Promise.resolve({
                code: error.code,
                error,
                stderr: error.stderr,
                stdout: error.stdout
            })
        }
    }

    async cacheDir(sourceDir: string, tool: string, version: string, arch?: string): Promise<string> {
        arch = arch || os.arch()
        if (!tool) {
            throw new Error('tool is a required parameter')
        }
        if (!version) {
            throw new Error('version is a required parameter')
        }
        if (!sourceDir) {
            throw new Error('sourceDir is a required parameter')
        }

        const cacheRoot = this.getCacheRootDir()
        if (!cacheRoot) {
            this.debug('cache root not set')
            return Promise.resolve('')
        }

        const destPath = path.join(cacheRoot, tool, version, arch)
        if (this.dirExists(destPath)) {
            this.debug(`Destination directory ${destPath} already exists, removing`)
            fs.rmSync(destPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 1000 })
        }

        this.debug(`Copying ${sourceDir} to ${destPath}`)
        fs.mkdirSync(destPath, { recursive: true })
        fs.cpSync(sourceDir, destPath, { recursive: true, force: true })

        this.debug(`Caching ${tool}@${version} (${arch}) from ${sourceDir}`)
        return Promise.resolve(destPath)
    }

    dirExists(file: string): boolean {
        return fs.existsSync(file) && fs.statSync(file).isDirectory()
    }

    fileExists(file: string): boolean {
        return fs.existsSync(file) && fs.statSync(file).isFile()
    }

    findLocalTool(toolName: string, versionSpec: string, arch?: string): string | null {
        arch = arch || os.arch()
        if (!toolName) {
            throw new Error('toolName is a required parameter')
        }
        if (!versionSpec) {
            throw new Error('versionSpec is a required parameter')
        }

        const cacheRoot = this.getCacheRootDir()
        if (!cacheRoot) {
            this.debug('cache root not set')
            return null
        }

        this.info(`Looking for local tool ${toolName}@${versionSpec} (${arch})`)
        const toolPath = path.join(cacheRoot, toolName, versionSpec, arch)
        if (!this.dirExists(toolPath)) {
            this.info(`Directory ${toolPath} not found`)
            return null
        } else {
            this.info(`Found tool ${toolName}@${versionSpec} (${arch})`)
        }

        return toolPath
    }

    getSourceDir(): string {
        const val = process.env['AGENT_SOURCE_DIR'] || ''
        return path.normalize(val.trim())
    }

    getTempRootDir(): string {
        const val = process.env['AGENT_TEMP_DIR'] || ''
        return path.normalize(val.trim())
    }

    getCacheRootDir(): string {
        const val = process.env['AGENT_TOOLS_DIR'] || ''
        return path.normalize(val.trim())
    }

    getBooleanInput(input: string, required?: boolean): boolean {
        const inputValue = this.getInput(input, required)
        return (inputValue || 'false').toLowerCase() === 'true'
    }

    getInput(input: string, required?: boolean): string {
        const val = process.env[`INPUT_${input.replace(/ /g, '_').toUpperCase()}`] || ''
        if (required && !val) {
            throw new Error(`Input required and not supplied: ${input}`)
        }
        return val.trim()
    }

    getListInput(input: string, required?: boolean): string[] {
        return this.getInput(input, required)
            .split('\n')
            .filter(x => x !== '')
    }

    setFailed(message: string, done?: boolean): void {
        console.log(`setFailed - ${message} - ${done}`)
    }

    setOutput(name: string, value: string): void {
        console.log(`setOutput - ${name} - ${value}`)
    }

    setSucceeded(message: string, done?: boolean): void {
        console.log(`setSucceeded - ${message} - ${done}`)
    }

    getVariable(name: string): string {
        this.debug(`getVariable - ${name}`)
        return process.env[name] || ''
    }

    setVariable(name: string, value: string): void {
        this.debug(`setVariable - ${name} - ${value}`)
        process.env[name] = value
    }

    async which(tool: string, _check?: boolean): Promise<string> {
        this.debug(`looking for tool '${tool}' in PATH`)
        const toolPath = await lookPath(tool)
        if (toolPath) {
            this.debug(`found tool '${tool}' in PATH: ${toolPath}`)
            return Promise.resolve(toolPath)
        }
        throw new Error(`Unable to locate executable file: ${tool}`)
    }
}
