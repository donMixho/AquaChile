const path = require('path');

module.exports = function (config) {
  config.set({
    basePath: __dirname,
    frameworks: ['jasmine'],
    files: [
      { pattern: 'src/**/*.spec.js', watched: false },
      { pattern: 'src/**/*.spec.jsx', watched: false }
    ],
    preprocessors: {
      'src/**/*.spec.js': ['webpack'],
      'src/**/*.spec.jsx': ['webpack']
    },
    webpack: {
      mode: 'development',
      devtool: 'inline-source-map',
      resolve: {
        extensions: ['.js', '.jsx', '.json'],
        // El cliente real usa import.meta.env y red: en pruebas se sustituye por un stub espiable.
        alias: {
          [path.resolve(__dirname, 'src/services/supabaseClient.js')]:
            path.resolve(__dirname, 'src/test/supabaseClientStub.js')
        }
      },
      module: {
        rules: [
          {
            test: /\.jsx?$/,
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader',
              options: {
                // Instrumenta el código fuente para medir cobertura (no las pruebas ni los helpers).
                plugins: [
                  ['istanbul', { exclude: ['**/__tests__/**', '**/*.spec.*', '**/src/test/**'] }]
                ]
              }
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
      'karma-webpack',
      'karma-coverage'
    ],
    reporters: ['spec', 'coverage'],
    coverageReporter: {
      dir: 'coverage',
      reporters: [
        { type: 'text-summary' },
        { type: 'html', subdir: 'html' },
        { type: 'lcovonly', subdir: '.' }
      ]
    },
    browsers: ['ChromeHeadless'],
    singleRun: true,
    concurrency: Infinity
  });
};
