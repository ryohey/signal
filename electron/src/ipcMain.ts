import { readdir, readFile, writeFile } from "node:fs/promises"
import { isAbsolute, join } from "node:path"
import {
  app,
  type BrowserWindow,
  dialog,
  type IpcMainInvokeEvent,
  ipcMain,
} from "electron"
import log from "electron-log"
import { getArgument } from "./arguments"
import { signInWithBrowser } from "./auth"
import type { FirebaseCredential } from "./FirebaseCredential"

interface Callbacks {
  getMainWindow: () => BrowserWindow
  onReady: () => void
  onAuthStateChanged: (isLoggedIn: boolean) => void
  onMainWindowClose: () => void
  onAuthCallback: (credential: FirebaseCredential) => void
}

const api = ({
  getMainWindow,
  onReady,
  onAuthStateChanged,
  onMainWindowClose,
  onAuthCallback,
}: Callbacks) => ({
  ready: () => {
    onReady()
  },
  showMessageBox: async (
    _e: IpcMainInvokeEvent,
    {
      message,
      buttons,
      type,
    }: {
      message: string
      buttons: string[]
      type?: "none" | "info" | "error" | "question" | "warning"
    }
  ) => {
    const result = await dialog.showMessageBox(getMainWindow(), {
      message,
      buttons,
      type,
    })
    return result.response
  },
  showOpenDialog: async () => {
    const fileObj = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "MIDI File", extensions: ["mid", "midi"] }],
    })
    if (fileObj.canceled) {
      return null
    }
    const path = fileObj.filePaths[0]
    const content = await readFile(path)
    return { path, content: content.buffer }
  },
  showOpenDirectoryDialog: async () => {
    const fileObj = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    })
    if (fileObj.canceled) {
      return null
    }
    const path = fileObj.filePaths[0]
    return path
  },
  saveFile: async (_e: IpcMainInvokeEvent, path: string, data: ArrayBuffer) => {
    await writeFile(path, Buffer.from(data))
  },
  readFile: async (_e: IpcMainInvokeEvent, path: string) => {
    const filePath = isAbsolute(path) ? path : join(app.getAppPath(), path)
    const content = await readFile(filePath)
    return content.buffer
  },
  searchSoundFonts: async (_e: IpcMainInvokeEvent, path: string) => {
    const files = await readdir(path, { withFileTypes: true })
    return files
      .filter((f) => f.isFile() && f.name.endsWith(".sf2"))
      .map((f) => join(f.path, f.name))
  },
  showSaveDialog: async () => {
    const fileObj = await dialog.showSaveDialog({
      filters: [{ name: "MIDI File", extensions: ["mid", "midi"] }],
    })
    if (fileObj.canceled) {
      return null
    }
    const path = fileObj.filePath
    if (!path) {
      return null
    }
    return { path }
  },
  addRecentDocument: (_e: IpcMainInvokeEvent, path: string) => {
    app.addRecentDocument(path)
  },
  getArgument: async () => getArgument(),
  openAuthWindow: async () => {
    try {
      const credential = await signInWithBrowser()
      onAuthCallback(credential)
    } catch (e) {
      log.error(e)
    }
  },
  authStateChanged: (_e: IpcMainInvokeEvent, isLoggedIn: boolean) => {
    onAuthStateChanged(isLoggedIn)
  },
  closeMainWindow: () => {
    onMainWindowClose()
  },
})

export type IpcMainAPI = ReturnType<typeof api>

export const registerIpcMain = (callbacks: Callbacks) => {
  Object.entries(api(callbacks)).forEach(([name, func]) => {
    ipcMain.handle(name, func)
  })
}
