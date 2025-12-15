import { existsSync } from "fs"
import fs from "fs/promises"
import { setTimeout } from "node:timers/promises"
import path, { dirname } from "path"
import puppeteer from "puppeteer"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const browser = await puppeteer.launch({
  headless: false,
  ignoreDefaultArgs: ["--mute-audio"],
  args: ["--autoplay-policy=no-user-gesture-required"],
})
const page = await browser.newPage()
await page.goto("http://localhost:3000/edit?disableFileSystem=true", {
  waitUntil: "networkidle0",
})

// open midi file

page.on("dialog", async (dialog) => {
  console.log(dialog.type())
  console.log(dialog.message())
  console.log(dialog.defaultValue())
  await dialog.accept()
})

await page.click("#tab-file", { delay: 200 })
const [fileChooser] = await Promise.all([
  page.waitForFileChooser(),
  page.click('label[for="OpenButtonInputFile"]'),
])
const midiFilePath = path.resolve(__dirname, "test.mid")
await fileChooser?.accept([midiFilePath])

await page.click("#button-play")

await setTimeout(10000)

const metrics = await page.metrics()
const result = JSON.stringify(metrics, null, 2)

const writeFile = async (dir, prefix, content) => {
  let count = 0
  while (true) {
    const filePath = path.resolve(dir, `${prefix}${count}.json`)
    if (existsSync(filePath)) {
      count++
    } else {
      await fs.mkdir(dir, { recursive: true })
      await fs.writeFile(filePath, content, { encoding: "utf-8" })
      break
    }
  }
}

await writeFile(path.resolve(__dirname, "output"), "metrics", result)

await browser.close()
