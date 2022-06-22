module.exports = (path, options) => {
  /**
   * Jest does not like .js extensions when not running Jest in EXPERIMENTAL AND TOTALLY UNSTABLE YELL-AT-YA esm mode.
   * We rewrite it so we can run the tests.
   * Once we can run everything in ESM only, we can delete this.
   */
  if (
    path.startsWith('.') &&
    path.endsWith('.js') &&
    // we don't want to rewrite node_modules, only the code we own!
    options.basedir.includes('node_modules') === false
  ) {
    path = path.replace(/\.js$/, '')
  }

  // Call the defaultResolver, so we leverage its cache, error handling, etc.
  return options.defaultResolver(path, {
    ...options,
  })
}
