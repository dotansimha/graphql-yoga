// WARNING: please make sure the versions are the same across all workspaces
const singletons = [
  '@nestjs/core',
  '@nestjs/common',
  '@nestjs/graphql',
  '@apollo/subgraph',
  '@apollo/federation-subgraph-compatibility',
]

function afterAllResolved(lockfile, context) {
  context.log('Enforcing single version for: ' + singletons.join(', '))

  // find and choose one version for the singletons
  const singletonsMap = {}
  const danglingSingletons = []
  for (const pkg of Object.keys(lockfile.packages)) {
    const singlePkg = singletons.find((singlePkg) =>
      pkg.startsWith(`/${singlePkg}/`),
    )
    if (!singlePkg) {
      continue
    }
    if (singlePkg in singletonsMap) {
      danglingSingletons.push(pkg)
      continue
    }
    singletonsMap[singlePkg] = pkg.replace(`/${singlePkg}/`, '')
  }

  // remove dangling singletons from lockfile
  for (const dangling of danglingSingletons) {
    delete lockfile.packages[dangling]
  }

  // apply singleton versions
  ;[lockfile.packages, lockfile.importers].forEach((list) => {
    for (const info of Object.values(list)) {
      const deps = info.dependencies
      const devDeps = info.devDependencies

      for (const [pkg, ver] of Object.entries(singletonsMap)) {
        if (pkg in (deps || {})) {
          deps[pkg] = ver
        }
        if (pkg in (devDeps || {})) {
          devDeps[pkg] = ver
        }
      }
    }
  })

  return lockfile
}

module.exports = {
  hooks: {
    afterAllResolved,
  },
}
