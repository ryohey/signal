import fs from "node:fs"
import pngToIco from "png-to-ico"

try {
  const buf = await pngToIco("../../icons/icon@2x.png")
  fs.writeFileSync("../../icons/icon.ico", buf)
} catch (err) {
  console.error(err)
}
