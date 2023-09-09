import { IBuildAgent, IExecResult } from '@tools/common';
import * as os from 'node:os';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import * as process from 'node:process';
import { lookPath } from './internal/lookPath.ts';
import { execSync } from 'node:child_process';

export class BuildAgent implements IBuildAgent {
    public get agentName(): string {
        return 'Local';
    }

    addPath(toolPath: string): void {
        let newPath = toolPath + path.delimiter + process.env['PATH'];
        this.debug('new Path: ' + newPath);
        process.env['PATH'] = newPath;
        console.log(`addPath - ${toolPath}`);
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
        execSync(`${exec} ${args.join(' ')}`, { stdio: 'inherit' });
        return Promise.resolve({} as IExecResult);
    }

    cacheDir(sourceDir: string, tool: string, version: string, arch?: string): Promise<string> {
        arch = arch || os.arch();
        this.debug(`Caching ${tool}@${version} (${arch}) from ${sourceDir}`);
        return Promise.resolve('');
    }

    createTempDir(): Promise<string> {
        let tempRootDir = this.getTempRootDir();
        let uuid = crypto.randomUUID();
        let tempPath = path.join(tempRootDir, uuid);
        this.debug(`Creating temp directory ${tempPath}`);
        fs.mkdirSync(tempPath);
        return Promise.resolve(tempPath);
    }

    dirExists(file: string): boolean {
        return fs.existsSync(file) && fs.statSync(file).isDirectory();
    }

    fileExists(file: string): boolean {
        return fs.existsSync(file) && fs.statSync(file).isFile();
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

        this.info(`Looking for local tool ${toolName}@${versionSpec} (${arch})`);
        let toolPath = path.join(cacheRoot, toolName, versionSpec, arch);
        if (!this.dirExists(toolPath)) {
            this.info(`Directory ${toolPath} not found`);
            return null;
        }

        return toolPath;
    }

    getSourceDir(): string {
        const val = process.env['AGENT_SOURCE_DIR'] || '';
        return val.trim();
    }

    getTempRootDir(): string {
        const val = process.env['AGENT_TEMP_DIR'] || '';
        return val.trim();
    }

    getCacheRootDir(): string {
        const val = process.env['AGENT_TOOLS_DIR'] || '';
        return val.trim();
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
        this.debug(`getVariable - ${name}`);
        return process.env[name] || '';
    }

    setVariable(name: string, val: string): void {
        this.debug(`setVariable - ${name} - ${val}`);
        process.env[name] = val;
    }

    async which(tool: string, _check?: boolean): Promise<string> {
        this.debug(`looking for tool '${tool}' in PATH`);
        let toolPath = await lookPath(tool);
        if (toolPath) {
            this.debug(`found tool '${tool}' in PATH: ${toolPath}`);
            return Promise.resolve(toolPath);
        }
        throw new Error(`Unable to locate executable file: ${tool}`);
    }
}