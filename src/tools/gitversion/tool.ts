import { DotnetTool, IBuildAgent } from '@tools/common';

export class GitVersionTool extends DotnetTool {

    public get toolName(): string {
        return 'GitVersion.Tool';
    }

    constructor(buildAgent: IBuildAgent) {
        super(buildAgent);
    }
}