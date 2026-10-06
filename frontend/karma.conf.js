module.exports = function (config) {
  config.set({
    basePath: __dirname,
    frameworks: ['jasmine'],
    files: [
      { pattern: 'src/**/*.spec.jsx', watched: false }
    ],
    preprocessors: {
      'src/**/*.spec.jsx': ['webpack']
    },
    webpack: {
      mode: 'development',
      devtool: 'inline-source-map',
      resolve: {
        extensions: ['.js', '.jsx', '.json']
      },
      module: {
        rules: [
          {
            test: /\.jsx?$/,
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader'
            }
          }
        ]
      }
    },
    webpackMiddleware: {
      stats: 'errors-only'
    },
    plugins: [
      'karma-jasmine',
      'karma-chrome-launcher',
      'karma-spec-reporter',
      'karma-webpack'
    ],
    reporters: ['spec'],
    browsers: ['ChromeHeadless'],
    singleRun: true,
    concurrency: Infinity
  });
};