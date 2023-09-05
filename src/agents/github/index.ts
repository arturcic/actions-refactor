import { IBuildAgent } from '@tools/common';

export class BuildAgent implements IBuildAgent {
    public get agentName(): string {
        return 'GitHub Actions';
    }

    debug(message: string): void {
        console.log(`[${this.agentName}] ${message}`);
    }

    public getBooleanInput(input: string, required?: boolean): boolean {
        console.log(`getBooleanInput - ${input} - ${required}`);
        return false;
    }

    public getInput(input: string, required?: boolean): string {
        console.log(`getInput - ${input} - ${required}`);
        return 'getInput';
    }

    public getListInput(input: string, required?: boolean): string[] {
        console.log(`getListInput - ${input} - ${required}`);
        return ['getInput'];
    }

    public getSourceDir(): string {
        console.log('getSourceDir');
        return 'getSourceDir';
    }
}