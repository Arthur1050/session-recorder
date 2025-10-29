const path = require('path');

module.exports = {
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'session-recorder.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'SessionRecorder',
      type: 'umd',
      export: 'default',
    },
    globalObject: 'this',
  },
};