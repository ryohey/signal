import { app, BrowserWindow, Menu, shell } from "electron"
import log from "electron-log"
import windowStateKeeper from "electron-window-state"
import path from "path"
import { getArgument } from "./arguments"
import { defaultMenuTemplate } from "./defaultMenu"
import { Ipc } from "./ipc"
import { registerIpcMain } from "./ipcMain"
import { menuTemplate } from "./menu"

const isMas = process.mas === true

log.initialize()

log.info(
  "electron:launch",
  `v${app.getVersion()}, platform: ${process.platform}, arch: ${process.arch}, env: ${process.env.NODE_ENV}, isPacked: ${app.isPackaged}, isMas: ${isMas}, userData: ${app.getPath("userData")}`,
)

process.on("uncaughtException", (err) => {
  log.error("electron:event:uncaughtException")
  log.error(err)
  log.error(err.stack)
})

process.on("unhandledRejection", (err) => {
  log.error("electron:event:unhandledRejection")
  log.error(err)
})

let onOpenFile: (filePath: string) => void = () => {}
let onDropFileOnAppIcon: (filePath: string) => void = () => {}
let mainWindow: BrowserWindow
let mainMenu: Electron.Menu

// Path of the file to open specified at startup
let openFilePath: string | null = null

const ipc = new Ipc()

function updateMainMenu(isLoggedIn: boolean) {
  mainMenu = Menu.buildFromTemplate(
    menuTemplate({
      isLoggedIn,
      onClickNew: () => ipc.send("onNewFile"),
      onClickOpen: async () => ipc.send("onClickOpenFile"),
      onClickSave: () => ipc.send("onSaveFile"),
      onClickSaveAs: () => ipc.send("onSaveFileAs"),
      onClickRename: () => ipc.send("onRename"),
      onClickImport: () => ipc.send("onImport"),
      onClickExportWav: () => ipc.send("onExportWav"),
      onClickExportMp3: () => ipc.send("onExportMp3"),
      onClickUndo: () => ipc.send("onUndo"),
      onClickRedo: () => ipc.send("onRedo"),
      onClickCut: () => ipc.send("onCut"),
      onClickCopy: () => ipc.send("onCopy"),
      onClickPaste: () => ipc.send("onPaste"),
      onClickDuplicate: () => ipc.send("onDuplicate"),
      onClickDelete: () => ipc.send("onDelete"),
      onClickSelectAll: () => ipc.send("onSelectAll"),
      onClickSelectNextNote: () => ipc.send("onSelectNextNote"),
      onClickSelectPreviousNote: () => ipc.send("onSelectPreviousNote"),
      onClickTransposeUpOctave: () => ipc.send("onTransposeUpOctave"),
      onClickTransposeDownOctave: () => ipc.send("onTransposeDownOctave"),
      onClickTranspose: () => ipc.send("onTranspose"),
      onClickQuantize: () => ipc.send("onQuantize"),
      onClickVelocity: () => ipc.send("onVelocity"),
      onClickSetting: () => ipc.send("onOpenSetting"),
      onClickHelp: () => ipc.send("onOpenHelp"),
      onClickSupport: () => openSupportPage(),
    }),
  )
  Menu.setApplicationMenu(mainMenu)
}

registerIpcMain({
  getMainWindow() {
    return mainWindow
  },
  onReady() {
    if (openFilePath !== null) {
      onOpenFile(openFilePath)
      openFilePath = null
    }
  },
  onAuthStateChanged(isLoggedIn) {
    updateMainMenu(isLoggedIn)
  },
  onMainWindowClose() {
    mainWindow.destroy()
  },
  onAuthCallback(credential) {
    log.info("electron:event:open-url", "ID Token is received")
    mainWindow.focus()
    ipc.send("onBrowserSignInCompleted", { credential })
  },
})

const createWindow = (): void => {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 960,
    defaultHeight: 720,
  })

  // Create the browser window.
  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    title: `PipeDream 2.0 v${app.getVersion()}`,
    titleBarStyle: isMas ? "hidden" : "default",
    trafficLightPosition: { x: 10, y: 17 },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, "preload.js"),
    },
  })

  mainWindowState.manage(mainWindow)

  // and load the index.html of the app.
  if (!app.isPackaged) {
    mainWindow.loadURL("http://localhost:3000/")
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(
      path.join(__dirname, "..", "dist_renderer", "index.html"),
    )
  }

  ipc.mainWindow = mainWindow

  updateMainMenu(false)

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) {
      shell.openExternal(url)
    }
    return { action: "deny" }
  })

  onDropFileOnAppIcon = (filePath) => {
    ipc.send("onOpenFile", { filePath })
  }

  onOpenFile = (filePath) => {
    ipc.send("onOpenFile", { filePath })
  }

  log.info("electron:event:createWindow", "Window created")
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  log.info("electron:event:ready")
  createWindow()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  log.info("electron:event:window-all-closed")
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", () => {
  log.info("electron:event:activate")
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

if (process.platform === "darwin" && !isMas) {
  const additionalData = { filePath: getArgument() }
  type AdditionalData = typeof additionalData
  const gotTheLock = app.requestSingleInstanceLock(additionalData)

  if (!gotTheLock) {
    log.info("electron:event:quit", "Another instance is running")
    app.quit()
  } else {
    log.info("electron:event:ready", "Registering second-instance event")
    app.on(
      "second-instance",
      (_event, _argv, _workingDirectory, additionalData) => {
        const { filePath } = additionalData as AdditionalData
        if (filePath !== null) {
          onDropFileOnAppIcon(filePath)
        }
      },
    )
  }
}

app.on("open-file", (event, filePath) => {
  log.info("electron:event:open-file", filePath)
  event.preventDefault()
  if (mainWindow) {
    onOpenFile(filePath)
  } else {
    openFilePath = filePath
  }
})

app.on("browser-window-focus", (_event, window) => {
  log.info("electron:event:browser-window-focus")
  const defaultMenu = Menu.buildFromTemplate(defaultMenuTemplate)
  Menu.setApplicationMenu(window === mainWindow ? mainMenu : defaultMenu)
})

function openSupportPage() {
  shell.openExternal("https://signalmidi.app/support")
}

log.info("electron:event:app-ready")
