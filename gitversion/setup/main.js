import util from 'node:util'
import { execFile } from 'node:child_process'

const execJsFile = util.promisify(execFile)
try {
    const { stdout, stderr } = await execJsFile('node', ['dist/tools/gitversion.js', '--buildAgent', 'github', '--command', 'setup'])
    console.log(stdout)
    console.error(stderr)
} catch (error) {
    console.log(error)
}
