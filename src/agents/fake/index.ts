import { IBuildAgent, IExecResult } from '@tools/common';
import os from 'node:os';
import path from 'node:path';

export class BuildAgent implements IBuildAgent {
    public get agentName(): string {
        return 'Local';
    }

    addPath(inputPath: string): void {
        console.log(`addPath - ${inputPath}`);
    }

    debug(message: string): void {
        console.log(`[debug] ${message}`);
    }

    info(message: string): void {
        console.log(`[info] - ${message}`);
    }

    warn(message: string): void {
        console.warn(`[warn] - ${message}`);
    }

    error(message: string): void {
        console.error(`[error] - ${message}`);
    }

    exec(exec: string, args: string[]): Promise<IExecResult> {
        console.log(`exec - ${exec} - ${args}`);
        return Promise.resolve({} as IExecResult);
    }

    cacheDir(sourceDir: string, tool: string, version: string, arch?: string): Promise<string> {
        console.log(`cacheDir - ${sourceDir} - ${tool} - ${version} - ${arch}`);
        return Promise.resolve('');
    }

    createTempDir(): Promise<string> {
        console.log(`createTempDir`);
        return Promise.resolve('');
    }

    dirExists(file: string): boolean {
        console.log(`directoryExists - ${file}`);
        return false;
    }

    fileExists(file: string): boolean {
        console.log(`fileExists - ${file}`);
        return false;
    }

    findLocalTool(toolName: string, versionSpec: string, arch?: string): string | null {
        arch = arch || os.arch();
        if (!toolName) {
            throw new Error('toolName is a required parameter');
        }
        if (!versionSpec) {
            throw new Error('versionSpec is a required parameter');
        }

        let cacheRoot = this.getCacheRootDir();
        if (!cacheRoot) {
            this.debug('cache root not set');
            return null;
        }

        this.info(`looking for local tool ${toolName}@${versionSpec} (${arch})`);
        let toolPath = path.join(cacheRoot, toolName, versionSpec, arch);
        if (!this.dirExists(toolPath)) {
            this.debug(`directory ${toolPath} not found`);
            return null;
        }

        return toolPath;
    }

    getSourceDir(): string {
        console.log('getSourceDir');
        return 'getSourceDir';
    }

    getCacheRootDir(): string {
        console.log('getCacheRoot');
        return 'getCacheRoot';
    }

    getBooleanInput(input: string, required?: boolean): boolean {
        const trueValue = ['true', 'True', 'TRUE'];
        const falseValue = ['false', 'False', 'FALSE'];
        const val = this.getInput(input, required);
        if (trueValue.includes(val))
            return true;
        if (falseValue.includes(val))
            return false;
        throw new TypeError(`Input does not meet YAML 1.2 "Core Schema" specification: ${input}\n` +
            `Support boolean input list: \`true | True | TRUE | false | False | FALSE\``);
    }

    getInput(input: string, required?: boolean): string {
        const val = process.env[`INPUT_${input.replace(/ /g, '_').toUpperCase()}`] || '';
        if (required && !val) {
            throw new Error(`Input required and not supplied: ${input}`);
        }
        return val.trim();
    }

    getListInput(input: string, required?: boolean): string[] {
        return this.getInput(input, required)
            .split('\n')
            .filter(x => x !== '');
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

    getVariable(name: string): string {
        console.log(`getVariable - ${name}`);
        return '';
    }

    setVariable(name: string, val: string): void {
        console.log(`setVariable - ${name} - ${val}`);
    }

    which(tool: string, check?: boolean): Promise<string> {
        console.log(`which - ${tool} - ${check}`);
        return Promise.resolve('');
    }
}