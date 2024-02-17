/// <reference types="vite/client" />

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

    getBooleanInput(input: string, required?: boolean): boolean

    getInput(input: string, required?: boolean): string

    getListInput(input: string, required?: boolean): string[]

    setFailed(message: string, done?: boolean): void

    setOutput(name: string, value: string): void

    setSucceeded(message: string, done?: boolean): void

    getVariable(name: string): string | undefined

    setVariable(name: string, value: string): void

    which(tool: string, check?: boolean): Promise<string>
}

/*export async function getAgent(): Promise<IBuildAgent> {
    const agentType = import.meta.env.MODE
    console.log(`Agent Type loading: ${agentType}`)
    let agent: typeof import('@agents/azure') | typeof import('@agents/github') | typeof import('@agents/fake')
    if (agentType === 'azure') {
        agent = await import('@agents/azure')
    } else if (agentType === 'github') {
        agent = await import('@agents/github')
    } else {
        agent = await import('@agents/fake')
    }
    return new agent.BuildAgent()
}*/

export interface IExecResult {
    stdout: string
    stderr: string
    code: number
    error?: Error | null
}
