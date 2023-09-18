import { IBuildAgent, IExecResult } from '@tools/common'

import * as core from '@actions/core'
import * as exe from '@actions/exec'
import * as io from '@actions/io'
import * as toolCache from '@actions/tool-cache'
import fs from 'fs'

export class BuildAgent implements IBuildAgent {
    get agentName(): string {
        return 'GitHub Actions'
    }

    addPath(inputPath: string): void {
        core.addPath(inputPath)
    }

    debug(message: string): void {
        core.debug(message)
    }

    info(message: string): void {
        core.info(message)
    }

    warn(message: string): void {
        core.warning(message)
    }

    error(message: string): void {
        core.error(message)
    }

    async exec(exec: string, args: string[]): Promise<IExecResult> {
        const dotnetPath = await io.which(exec, true)
        const { exitCode, stdout, stderr } = await exe.getExecOutput(`"${dotnetPath}"`, args)
        return {
            code: exitCode,
            error: null,
            stderr,
            stdout
        }
    }

    async cacheDir(sourceDir: string, tool: string, version: string, arch?: string): Promise<string> {
        return toolCache.cacheDir(sourceDir, tool, version, arch)
    }

    dirExists(file: string): boolean {
        return fs.existsSync(file) && fs.statSync(file).isDirectory()
    }

    fileExists(file: string): boolean {
        return fs.existsSync(file) && fs.statSync(file).isFile()
    }

    findLocalTool(toolName: string, versionSpec: string, arch?: string): string | null {
        return toolCache.find(toolName, versionSpec, arch)
    }

    getSourceDir(): string {
        return this.getVariable('GITHUB_WORKSPACE')
    }

    getTempRootDir(): string {
        return this.getVariable('RUNNER_TEMP')
    }

    getCacheRootDir(): string {
        return this.getVariable('RUNNER_TOOL_CACHE')
    }

    getBooleanInput(input: string, required?: boolean): boolean {
        const inputValue = this.getInput(input, required)
        return (inputValue || 'false').toLowerCase() === 'true'
    }

    getInput(input: string, required?: boolean): string {
        return core.getInput(input, { required } as core.InputOptions)?.trim()
    }

    getListInput(input: string, required?: boolean): string[] {
        return this.getInput(input, required)
            .split('\n')
            .filter(x => x !== '')
    }

    setFailed(message: string, _: boolean): void {
        core.setFailed(message)
    }

    setOutput(name: string, value: string): void {
        core.setOutput(name, value)
    }

    setSucceeded(_message: string, _done?: boolean): void {
        //
    }

    getVariable(name: string): string {
        return process.env[name] || ''
    }

    setVariable(name: string, value: string): void {
        core.exportVariable(name, value)
    }

    async which(tool: string, check?: boolean): Promise<string> {
        return io.which(tool, check)
    }
}
