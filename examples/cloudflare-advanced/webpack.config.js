module.exports = {
  context: __dirname,
  target: 'webworker',
  devtool: 'cheap-module-source-map', // avoid "eval": Workers environment doesn’t allow it
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.mjs$/,
        type: 'javascript/auto',
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['*', '.ts', '.mjs', '.js'],
  },
  mode: 'development',
}
