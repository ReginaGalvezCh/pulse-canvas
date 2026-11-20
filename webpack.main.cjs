module.exports = {
  devtool: 'source-map',
  entry: './src/main/index.ts',
  module: { rules: [{ test: /\.tsx?$/, exclude: /node_modules/, use: { loader: 'ts-loader', options: { transpileOnly: true, compilerOptions: { noEmit: false } } } }] },
  resolve: { extensions: ['.js', '.ts', '.tsx'] },
  externals: { '@smartspectra/node-sdk': 'commonjs @smartspectra/node-sdk' }
};
