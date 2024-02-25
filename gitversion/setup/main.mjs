import { exec } from 'node:child_process'

exec('node dist/tools/gitversion.js --buildAgent github --command setup', (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`)
        return
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`)
        return
    }
    console.log(`stdout: ${stdout}`)
})
