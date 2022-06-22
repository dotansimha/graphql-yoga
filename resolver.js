module.exports = (path, options) => {
  /**
   * Jest does not like .js extensions when not running Jest in EXPERIMENTAL AND TOTALLY UNSTABLE mode.
   * We rewrite it so we can run the tests.
   */
  if (path.startsWith('.') && path.endsWith('.js')) {
    path = path.replace(/\.js$/, '')
  }

  // Call the defaultResolver, so we leverage its cache, error handling, etc.
  return options.defaultResolver(path, {
    ...options,
  })
}
