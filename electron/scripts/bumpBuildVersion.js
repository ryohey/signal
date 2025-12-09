// bump  BUILD_VERSION value in .env file
// Usage: node bumpBuildVersion.js

const fs = require("node:fs")
const path = require("node:path")
const dotenv = require("dotenv")

const envPath = path.join(__dirname, "..", ".env")
const env = dotenv.parse(fs.readFileSync(envPath))

const BUILD_VERSION = env.BUILD_VERSION
const newBuildVersion = parseInt(BUILD_VERSION, 10) + 1

env.BUILD_VERSION = newBuildVersion.toString()

fs.writeFileSync(
  envPath,
  Object.keys(env)
    .map((key) => `${key}=${env[key]}`)
    .join("\n")
)
console.log(`BUILD_VERSION bumped to ${newBuildVersion}`)
