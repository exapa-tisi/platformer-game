const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');
const WebpackObfuscator = require('webpack-obfuscator');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/index.ts',
    mode: isProduction ? 'production' : 'development',
    target: 'web',
    // Enable source maps in dev mode so you can read your original TS code in DevTools
    devtool: isProduction ? false : 'eval-source-map', 
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.js',
      publicPath: './',
      clean: true,
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource', // emits a separate file and exports the URL
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html',
        inject: 'body',
        minify: isProduction,
      }),
      new HtmlInlineScriptPlugin(),
      // Only obfuscate if we are building for production
      ...(isProduction
        ? [
            new WebpackObfuscator({
              rotateStringArray: true,
              stringArray: true,
              stringArrayThreshold: 0.75,
              compact: true,
              controlFlowFlattening: true,
            }),
          ]
        : []),
    ],
    // Development Server configuration
    devServer: {
      static: './dist',
      port: 3000,
      hot: true,         // Enables Live Reload / Hot Module Replacement
      open: true,        // Automatically opens http://localhost:3000 in your browser
    },
  };
};
