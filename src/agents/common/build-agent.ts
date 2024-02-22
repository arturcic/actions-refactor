import * as process from 'node:process'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as semver from 'semver'
import { IExecResult } from './models'

export interface IBuildAgent {
    agentName: string
    sourceDirVariable: string
    tempDirVariable: string
    cacheDirVariable: string

    sourceDir: string
    tempDir: string
    cacheDir: string

    addPath(inputPath: string): void

    debug(message: string): void

    info(message: string): void

    warn(message: string): void

    error(message: string): void

    exec(exec: string, args: string[]): Promise<IExecResult>

    cacheToolDir(sourceDir: string, tool: string, version: string, arch?: string): Promise<string>

    dirExists(file: string): Promise<boolean>

    dirRemove(file: string): void

    fileExists(file: string): Promise<boolean>

    findLocalTool(toolName: string, versionSpec: string, arch?: string): Promise<string | null>

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
    abstract sourceDirVariable: string
    abstract tempDirVariable: string
    abstract cacheDirVariable: string

    abstract addPath(inputPath: string): void

    abstract debug(message: string): void

    abstract info(message: string): void

    abstract warn(message: string): void

    abstract error(message: string): void

    abstract exec(exec: string, args: string[]): Promise<IExecResult>

    abstract setFailed(message: string, done?: boolean | undefined): void

    abstract setOutput(name: string, value: string): void

    abstract setSucceeded(message: string, done?: boolean | undefined): void

    abstract setVariable(name: string, value: string): void

    abstract which(tool: string, check?: boolean | undefined): Promise<string>

    get sourceDir(): string {
        return this.getVariableAsPath(this.sourceDirVariable)
    }

    get tempDir(): string {
        return this.getVariableAsPath(this.tempDirVariable)
    }

    get cacheDir(): string {
        return this.getVariableAsPath(this.cacheDirVariable)
    }

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

    async dirExists(file: string): Promise<boolean> {
        try {
            await fs.access(file)
            return (await fs.stat(file)).isDirectory()
        } catch (e) {
            return false
        }
    }

    async dirRemove(file: string): Promise<void> {
        await fs.rm(file, { recursive: true, force: true, maxRetries: 3, retryDelay: 1000 })
    }

    async fileExists(file: string): Promise<boolean> {
        try {
            await fs.access(file)
            return (await fs.stat(file)).isFile()
        } catch (e) {
            return false
        }
    }

    async cacheToolDir(sourceDir: string, tool: string, version: string, arch?: string): Promise<string> {
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

        const cacheRoot = this.cacheDir
        if (!cacheRoot) {
            this.debug('cache root not set')
            return ''
        }

        version = semver.clean(version) || version
        const destPath = path.join(cacheRoot, tool, version, arch)
        if (await this.dirExists(destPath)) {
            this.debug(`Destination directory ${destPath} already exists, removing`)
            await fs.rm(destPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 1000 })
        }

        this.debug(`Copying ${sourceDir} to ${destPath}`)
        await fs.mkdir(destPath, { recursive: true })
        await fs.cp(sourceDir, destPath, { recursive: true, force: true })

        this.debug(`Caching ${tool}@${version} (${arch}) from ${sourceDir}`)
        return destPath
    }

    async findLocalTool(toolName: string, versionSpec: string, arch?: string): Promise<string | null> {
        arch = arch || os.arch()
        if (!toolName) {
            throw new Error('toolName is a required parameter')
        }
        if (!versionSpec) {
            throw new Error('versionSpec is a required parameter')
        }

        const cacheRoot = this.cacheDir
        if (!cacheRoot) {
            this.debug('cache root not set')
            return null
        }

        versionSpec = semver.clean(versionSpec) || versionSpec
        this.info(`Looking for local tool ${toolName}@${versionSpec} (${arch})`)
        const toolPath = path.join(cacheRoot, toolName, versionSpec, arch)
        if (!(await this.dirExists(toolPath))) {
            this.info(`Directory ${toolPath} not found`)
            return null
        } else {
            this.info(`Found tool ${toolName}@${versionSpec} (${arch}) at ${toolPath}`)
        }

        return toolPath
    }
}
