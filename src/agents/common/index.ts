/// <reference types="vite/client" />

import os from 'node:os'
import * as semver from 'semver'
import path from 'node:path'
import fs from 'node:fs'
import process from 'node:process'

export interface IBuildAgent {
    agentName: string

    addPath(inputPath: string): void

    debug(message: string): void

    info(message: string): void

    warn(message: string): void

    error(message: string): void

    exec(exec: string, args: string[]): Promise<IExecResult>

    cacheDir(sourceDir: string, tool: string, version: string, arch?: string): Promise<string>

    dirExists(file: string): boolean

    fileExists(file: string): boolean

    findLocalTool(toolName: string, versionSpec: string, arch?: string): string | null

    getSourceDir(): string | undefined

    getTempRootDir(): string | undefined

    getCacheRootDir(): string | undefined

    getInput(input: string, required?: boolean): string

    getBooleanInput(input: string, required?: boolean): boolean

    getListInput(input: string, required?: boolean): string[]

    setFailed(message: string, done?: boolean): void

    setOutput(name: string, value: string): void

    setSucceeded(message: string, done?: boolean): void

    getVariable(name: string): string | undefined

    getVariableAsPath(name: string): string

    setVariable(name: string, value: string): void

    which(tool: string, check?: boolean): Promise<string>
}

export abstract class BuildAgentBase implements IBuildAgent {
    abstract agentName: string

    abstract addPath(inputPath: string): void

    abstract debug(message: string): void

    abstract info(message: string): void

    abstract warn(message: string): void

    abstract error(message: string): void

    abstract exec(exec: string, args: string[]): Promise<IExecResult>

    abstract getSourceDir(): string | undefined

    abstract getTempRootDir(): string | undefined

    abstract getCacheRootDir(): string | undefined

    abstract setFailed(message: string, done?: boolean | undefined): void

    abstract setOutput(name: string, value: string): void

    abstract setSucceeded(message: string, done?: boolean | undefined): void

    abstract setVariable(name: string, value: string): void

    abstract which(tool: string, check?: boolean | undefined): Promise<string>

    getInput(input: string, required?: boolean): string {
        input = input.replace(/ /g, '_').toUpperCase()
        const val = this.getVariable(`INPUT_${input}`)
        if (required && !val) {
            throw new Error(`Input required and not supplied: ${input}`)
        }
        return val.trim()
    }

    getBooleanInput(input: string, required?: boolean): boolean {
        const inputValue = this.getInput(input, required)
        return (inputValue || 'false').toLowerCase() === 'true'
    }

    getListInput(input: string, required?: boolean): string[] {
        return this.getInput(input, required)
            .split('\n')
            .filter(x => x !== '')
    }

    getVariable(name: string): string {
        this.debug(`getVariable - ${name}`)
        const val = process.env[name] || ''
        return val.trim()
    }

    getVariableAsPath(name: string): string {
        return path.resolve(path.normalize(this.getVariable(name)))
    }

    dirExists(file: string): boolean {
        return fs.existsSync(file) && fs.statSync(file).isDirectory()
    }

    fileExists(file: string): boolean {
        return fs.existsSync(file) && fs.statSync(file).isFile()
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

        version = semver.clean(version) || version
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

        versionSpec = semver.clean(versionSpec) || versionSpec
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
}

export interface IExecResult {
    stdout: string
    stderr: string
    code: number
    error?: Error | null
}

export async function getAgent(buildAgent: string | undefined): Promise<IBuildAgent> {
    const agent = `../agents/${buildAgent}/buildAgent.js`
    const module: { BuildAgent: new () => IBuildAgent } = await import(agent)
    return new module.BuildAgent()
}
