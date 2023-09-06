import { IBuildAgent, IExecResult } from '@tools/common';

export class BuildAgent implements IBuildAgent {
    public get agentName(): string {
        return 'Azure Pipelines';
    }

    debug(message: string): void {
        console.log(`[${this.agentName}] ${message}`);
    }

    getBooleanInput(input: string, required?: boolean): boolean {
        console.log(`getBooleanInput - ${input} - ${required}`);
        return false;
    }

    getInput(input: string, required?: boolean): string {
        console.log(`getInput - ${input} - ${required}`);
        return 'getInput';
    }

    getListInput(input: string, required?: boolean): string[] {
        console.log(`getListInput - ${input} - ${required}`);
        return ['getInput'];
    }

    getSourceDir(): string {
        console.log('getSourceDir');
        return 'getSourceDir';
    }

    setVariable(name: string, val: string): void {
        console.log(`setVariable - ${name} - ${val}`);
    }

    addPath(inputPath: string): void {
        console.log(`addPath - ${inputPath}`);
    }

    cacheDir(sourceDir: string, tool: string, version: string, arch?: string): Promise<string> {
        console.log(`cacheDir - ${sourceDir} - ${tool} - ${version} - ${arch}`);
        return Promise.resolve('');
    }

    createTempDir(): Promise<string> {
        console.log(`createTempDir`);
        return Promise.resolve('');
    }

    directoryExists(file: string): boolean {
        console.log(`directoryExists - ${file}`);
        return false;
    }

    error(message: string): void {
        console.error(`error - ${message}`);
    }

    exec(exec: string, args: string[]): Promise<IExecResult> {
        console.log(`exec - ${exec} - ${args}`);
        return Promise.resolve({} as IExecResult);
    }

    fileExists(file: string): boolean {
        console.log(`fileExists - ${file}`);
        return false;
    }

    find(toolName: string, versionSpec: string, arch?: string): string {
        console.log(`find - ${toolName} - ${versionSpec} - ${arch}`);
        return '';
    }

    getVariable(name: string): string {
        console.log(`getVariable - ${name}`);
        return '';
    }

    info(message: string): void {
        console.log(`info - ${message}`);
    }

    isValidInputFile(input: string, file: string): boolean {
        console.log(`isValidInputFile - ${input} - ${file}`);
        return false;
    }

    setFailed(message: string, done?: boolean): void {
        console.log(`setFailed - ${message} - ${done}`);
    }

    setOutput(name: string, value: string): void {
        console.log(`setOutput - ${name} - ${value}`);
    }

    setSucceeded(message: string, done?: boolean): void {
        console.log(`setSucceeded - ${message} - ${done}`);
    }

    warn(message: string): void {
        console.warn(`warn - ${message}`);
    }

    which(tool: string, check?: boolean): Promise<string> {
        console.log(`which - ${tool} - ${check}`);
        return Promise.resolve('');
    }
}