import { app, BrowserWindow } from "electron"
import log from "electron-log"
import type { FirebaseCredential } from "./FirebaseCredential"
import { authCallbackUrl } from "./scheme"

const authURL = (redirectUri: string) => {
  const parameter = `redirect_uri=${redirectUri}`

  return app.isPackaged
    ? `https://signalmidi.app/auth?${parameter}`
    : `http://localhost:3000/auth?${parameter}`
}

export const signInWithBrowser = async (): Promise<FirebaseCredential> => {
  return new Promise((resolve, reject) => {
    const url = authURL(authCallbackUrl)
    const window = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
      },
    })
    window.menuBarVisible = false
    window.loadURL(url)

    let isResolved = false

    window.webContents.on("will-navigate", (event, url) => {
      log.info("will-navigate", url)
      if (url.startsWith(authCallbackUrl)) {
        log.info("authCallbackUrl", url)
        window.close()

        // get ID token from the URL
        const urlObj = new URL(url)
        const credential = urlObj.searchParams.get("credential")

        if (credential === null) {
          log.error("electron:event:open-url", "ID Token is missing")
          reject(new Error("ID Token is missing"))
          return
        }

        log.info("electron:event:open-url", "ID Token is received")

        isResolved = true
        resolve(JSON.parse(credential))
      }
    })

    window.on("closed", () => {
      if (!isResolved) {
        reject(new Error("Window is closed"))
      }
    })
  })
}
