const fs = require('fs')
const path = require('path')

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
