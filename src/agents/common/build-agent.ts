import { exec as execNonPromise } from 'node:child_process'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as process from 'node:process'
import * as path from 'node:path'
import * as util from 'node:util'
import * as semver from 'semver'
import { lookPath } from './lookPath'
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

    getDelimitedInput(input: string, delimiter: string, required?: boolean): string[]

    getListInput(input: string, required?: boolean): string[]

    setSucceeded(message: string, done?: boolean): void

    setFailed(message: string, done?: boolean): void

    setOutput(name: string, value: string): void

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

    abstract debug(message: string): void

    abstract info(message: string): void

    abstract warn(message: string): void

    abstract error(message: string): void

    abstract setSucceeded(message: string, done?: boolean | undefined): void

    abstract setFailed(message: string, done?: boolean | undefined): void

    abstract setOutput(name: string, value: string): void

    abstract setVariable(name: string, value: string): void

    get sourceDir(): string {
        return this.getVariableAsPath(this.sourceDirVariable)
    }

    get tempDir(): string {
        return this.getVariableAsPath(this.tempDirVariable)
    }

    get cacheDir(): string {
        return this.getVariableAsPath(this.cacheDirVariable)
    }

    addPath(inputPath: string): void {
        const envName = process.platform === 'win32' ? 'Path' : 'PATH'
        const newPath = inputPath + path.delimiter + process.env[envName]
        this.debug(`new Path: ${newPath}`)
        process.env[envName] = newPath
        process.env.Path = newPath
        this.info(`Updated PATH: ${process.env[envName]}`)
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

    getDelimitedInput(input: string, delimiter: string, required?: boolean): string[] {
        return this.getInput(input, required)
            .split(delimiter)
            .filter(x => {
                if (x) {
                    return x.trim()
                }
            })
    }

    getListInput(input: string, required?: boolean): string[] {
        return this.getDelimitedInput(input, '\n', required)
    }

    getVariable(name: string): string {
        const value = (process.env[name] || '').trim()
        this.debug(`getVariable - ${name}: ${value}`)
        return value.trim()
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

    async exec(cmd: string, args: string[]): Promise<IExecResult> {
        const exec = util.promisify(execNonPromise)

        try {
            const { stdout, stderr } = await exec(`${cmd} ${args.join(' ')}`)
            return {
                code: 0,
                error: null,
                stderr,
                stdout
            }
        } catch (e) {
            const error = e as Error & { code: number; stderr: string; stdout: string }
            return {
                code: error.code,
                error,
                stderr: error.stderr,
                stdout: error.stdout
            }
        }
    }

    async which(tool: string, _check?: boolean): Promise<string> {
        this.debug(`looking for tool '${tool}' in PATH`)
        let toolPath = await lookPath(tool)
        if (toolPath) {
            toolPath = path.resolve(toolPath)
            this.debug(`found tool '${tool}' in PATH: ${toolPath}`)
            return toolPath
        }
        throw new Error(`Unable to locate executable file: ${tool}`)
    }
}
