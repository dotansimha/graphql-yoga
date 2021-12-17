const {
  readdirSync,
  lstatSync,
  ensureSymlinkSync,
  chmodSync,
  writeFileSync,
} = require('fs-extra')
const { resolve, join } = require('path')

const absoluteExamplesDirPath = resolve(__dirname, '../examples')
const absoluteGraphqlYogaBinPath = resolve(
  __dirname,
  '../packages/cli/dist/bin.js',
)
const dir = readdirSync(absoluteExamplesDirPath)
for (const path of dir) {
  const absolutePath = join(absoluteExamplesDirPath, path)
  if (lstatSync(absolutePath).isDirectory()) {
    const execNames = ['yoga', 'gql-yoga', 'graphql-yoga']
    for (const execName of execNames) {
      const targetPath = join(absolutePath, 'node_modules', '.bin', execName)
      ensureSymlinkSync(absoluteGraphqlYogaBinPath, targetPath)
      chmodSync(targetPath, '755')
      const targetCmdPath = targetPath + '.cmd'
      writeFileSync(
        targetCmdPath,
        `
@IF EXIST "%~dp0\\node.exe" (
  "%~dp0\\node.exe"  "${absoluteGraphqlYogaBinPath}" %*
) ELSE (
  @SETLOCAL
  @SET PATHEXT=%PATHEXT:;.JS;=;%
  node  "${absoluteGraphqlYogaBinPath}" %*
)
            `,
      )
      chmodSync(targetCmdPath, '755')
    }
  }
}
