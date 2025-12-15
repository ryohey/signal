import { BrowserWindow } from "electron"
import { FirebaseCredential } from "./FirebaseCredential"

export type IpcEvent =
  | { name: "onNewFile" }
  | { name: "onClickOpenFile" }
  | { name: "onSaveFile" }
  | { name: "onSaveFileAs" }
  | { name: "onRename" }
  | { name: "onImport" }
  | { name: "onExportWav" }
  | { name: "onExportMp3" }
  | { name: "onUndo" }
  | { name: "onRedo" }
  | { name: "onCut" }
  | { name: "onCopy" }
  | { name: "onPaste" }
  | { name: "onDuplicate" }
  | { name: "onDelete" }
  | { name: "onSelectAll" }
  | { name: "onSelectNextNote" }
  | { name: "onSelectPreviousNote" }
  | { name: "onTransposeUpOctave" }
  | { name: "onTransposeDownOctave" }
  | { name: "onTranspose" }
  | { name: "onQuantize" }
  | { name: "onVelocity" }
  | { name: "onOpenSetting" }
  | { name: "onOpenHelp" }
  | { name: "onOpenFile"; params: { filePath: string } }
  | {
      name: "onBrowserSignInCompleted"
      params: { credential: FirebaseCredential }
    }

export type ParamsForEvent<T extends IpcEvent["name"]> =
  Extract<IpcEvent, { name: T }> extends { params: infer P } ? P : undefined

export class Ipc {
  mainWindow: BrowserWindow | null = null

  send<T extends IpcEvent["name"]>(name: T, params?: ParamsForEvent<T>): void {
    if (this.mainWindow === null) {
      throw new Error("mainWindow is not set")
    }
    this.mainWindow.webContents.send(name, params)
  }
}
