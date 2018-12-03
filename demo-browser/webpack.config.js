const webpack = require('webpack');

module.exports = {
  devtool: "source-map",
  entry: "./src/demo.ts",
  mode: "development",

  module: {
    rules: [
      { test: /\.ts$/, loader: "awesome-typescript-loader" },
      { enforce: "pre", test: /\.js$/, loader: "source-map-loader" }
    ]
  },

  output: {
    filename: "bundle.js",
    path: __dirname + "/dist"
  },

  plugins: [
    new webpack.EnvironmentPlugin([ 'API_KEY', 'API_SECRET', 'API_SERVER' ]),
  ],
  
  resolve: {
    extensions: [".ts", ".js", ".json"]
  },
};
