/* eslint-env node */
const fs = require('node:fs')
const path = require('node:path')

// supply the wished graphql version as first argument of script
const graphqlVersion = process.argv[2]

const pkgPath = path.resolve(__dirname, '..', 'package.json')
const pkgFile = fs.readFileSync(pkgPath)

const pkg = JSON.parse(pkgFile.toString())
pkg.resolutions = {
  ...pkg.resolutions,
  graphql: graphqlVersion,
}

fs.writeFileSync(pkgPath, JSON.stringify(pkg, undefined, '  ') + '\n')

// disable apollo federation testing with <16 versions
const graphql15AndLess = parseInt(graphqlVersion.split('.')[0]) <= 15
;[`examples/apollo-federation`].forEach((testPath) => {
  if (graphql15AndLess) {
    // disable
    const testPathAbs = path.resolve(
      __dirname,
      '..',
      testPath,
      '__integration-tests__',
    )
    if (fs.existsSync(testPathAbs)) {
      fs.renameSync(
        testPathAbs,
        path.resolve(
          __dirname,
          '..',
          testPath,
          '__DISABLED_integration-tests__',
        ),
      )
    }
  } else {
    // enable if disabled
    const testPathAbs = path.resolve(
      __dirname,
      '..',
      testPath,
      '__DISABLED_integration-tests__',
    )
    if (fs.existsSync(testPathAbs)) {
      fs.renameSync(
        testPathAbs,
        path.resolve(__dirname, '..', testPath, '__integration-tests__'),
      )
    }
  }
})
