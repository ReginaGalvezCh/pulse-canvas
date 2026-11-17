module.exports = {
  devtool: 'source-map',
  module: { rules: [
    { test: /\.tsx?$/, exclude: /node_modules/, use: { loader: 'ts-loader', options: { transpileOnly: true, compilerOptions: { noEmit: false } } } },
    { test: /\.css$/, use: ['style-loader', { loader: 'css-loader', options: { modules: { auto: /\.module\.css$/, namedExport: false, localIdentName: '[local]__[hash:base64:5]' } } }] }
  ] },
  resolve: { extensions: ['.js', '.ts', '.tsx'] }
};
