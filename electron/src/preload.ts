import { contextBridge, ipcRenderer } from "electron"
import { ElectronAPI } from "./ElectronAPI"
import type { IpcEvent, ParamsForEvent } from "./ipc"
import type { IpcMainAPI } from "./ipcMain"

type Tail<T extends unknown[]> = T extends [any, ...infer Rest] ? Rest : []

const register =
  <T extends IpcEvent["name"]>(name: T) =>
  (callback: (params: ParamsForEvent<T>) => void) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      value: ParamsForEvent<T>,
    ) => {
      callback(value)
    }
    ipcRenderer.on(name, listener)
    return () => {
      ipcRenderer.removeListener(name, listener)
    }
  }

const invoke =
  <T extends keyof IpcMainAPI>(name: T) =>
  (...params: Tail<Parameters<IpcMainAPI[T]>>) =>
    ipcRenderer.invoke(name, ...params) as ReturnType<IpcMainAPI[T]>

const api: ElectronAPI = {
  onNewFile: register("onNewFile"),
  onClickOpenFile: register("onClickOpenFile"),
  onOpenFile: register("onOpenFile"),
  onSaveFile: register("onSaveFile"),
  onSaveFileAs: register("onSaveFileAs"),
  onRename: register("onRename"),
  onImport: register("onImport"),
  onExportWav: register("onExportWav"),
  onExportMp3: register("onExportMp3"),
  onUndo: register("onUndo"),
  onRedo: register("onRedo"),
  onCut: register("onCut"),
  onCopy: register("onCopy"),
  onPaste: register("onPaste"),
  onDuplicate: register("onDuplicate"),
  onDelete: register("onDelete"),
  onSelectAll: register("onSelectAll"),
  onSelectNextNote: register("onSelectNextNote"),
  onSelectPreviousNote: register("onSelectPreviousNote"),
  onTransposeUpOctave: register("onTransposeUpOctave"),
  onTransposeDownOctave: register("onTransposeDownOctave"),
  onTranspose: register("onTranspose"),
  onQuantize: register("onQuantize"),
  onVelocity: register("onVelocity"),
  onOpenSetting: register("onOpenSetting"),
  onOpenHelp: register("onOpenHelp"),
  onBrowserSignInCompleted: register("onBrowserSignInCompleted"),
  // tell to main process that the renderer process is ready
  ready: invoke("ready"),
  showMessageBox: invoke("showMessageBox"),
  showOpenDialog: invoke("showOpenDialog"),
  showOpenDirectoryDialog: invoke("showOpenDirectoryDialog"),
  showSaveDialog: invoke("showSaveDialog"),
  saveFile: invoke("saveFile"),
  readFile: invoke("readFile"),
  searchSoundFonts: invoke("searchSoundFonts"),
  addRecentDocument: invoke("addRecentDocument"),
  getArgument: invoke("getArgument"),
  openAuthWindow: invoke("openAuthWindow"),
  authStateChanged: invoke("authStateChanged"),
  closeMainWindow: invoke("closeMainWindow"),
}

contextBridge.exposeInMainWorld("electronAPI", api)
