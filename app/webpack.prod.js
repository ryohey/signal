const { merge } = require("webpack-merge")
const common = require("./webpack.common.js")
const CopyPlugin = require("copy-webpack-plugin")
const { sentryWebpackPlugin } = require("@sentry/webpack-plugin")
const WorkboxPlugin = require("workbox-webpack-plugin")
const fs = require("fs")
const path = require("path")

// Custom plugin to generate version.json
class GenerateVersionJsonPlugin {
  apply(compiler) {
    compiler.hooks.emit.tap("GenerateVersionJsonPlugin", (compilation) => {
      const version = {
        commitSha: process.env.VERCEL_GIT_COMMIT_SHA || "development",
        buildTime: new Date().toISOString(),
        version: require("./package.json").version,
      }

      const versionJson = JSON.stringify(version, null, 2)
      compilation.assets["version.json"] = {
        source: () => versionJson,
        size: () => versionJson.length,
      }
    })
  }
}

module.exports = merge(common, {
  mode: "production",
  optimization: {
    concatenateModules: false,
    splitChunks: {
      chunks: "all",
    },
  },
  module: {
    rules: [
      {
        test: /\.(j|t)sx?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
    ],
  },
  plugins: [
    new GenerateVersionJsonPlugin(),
    new WorkboxPlugin.GenerateSW({
      maximumFileSizeToCacheInBytes: 50000000,
      clientsClaim: true,
      skipWaiting: true,
      runtimeCaching: [
        {
          urlPattern: /^\/.*$/,
          handler: "StaleWhileRevalidate",
        },
        {
          urlPattern: /^.+\.sf2$/,
          handler: "StaleWhileRevalidate",
        },
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com/,
          handler: "StaleWhileRevalidate",
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com/,
          handler: "StaleWhileRevalidate",
        },
      ],
    }),
    new CopyPlugin({
      patterns: [
        { from: "public/*.svg", to: "[name][ext]" },
        { from: "public/*.png", to: "[name][ext]" },
        { from: "public/*.webmanifest", to: "[name][ext]" },
      ],
    }),
    sentryWebpackPlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: "codingcafe_jp",
      project: "signal",
      release: process.env.VERCEL_GIT_COMMIT_SHA,
      include: "./dist",
      ignore: [
        "node_modules",
        "webpack.common.js",
        "webpack.dev.js",
        "webpack.prod.js",
      ],
      dryRun: process.env.VERCEL_ENV !== "production",
      debug: true,
      errorHandler: (err) => {
        console.warn("Sentry CLI Plugin: " + err.message)
      },
    }),
  ],
})
