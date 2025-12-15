export type Unsubscribe = () => void

export type ElectronAPI = {
  onNewFile: (callback: () => void) => Unsubscribe
  onClickOpenFile: (callback: () => void) => Unsubscribe
  onOpenFile: (callback: (params: { filePath: string }) => void) => Unsubscribe
  onSaveFile: (callback: () => void) => Unsubscribe
  onSaveFileAs: (callback: () => void) => Unsubscribe
  onRename: (callback: () => void) => Unsubscribe
  onImport: (callback: () => void) => Unsubscribe
  onExportWav: (callback: () => void) => Unsubscribe
  onExportMp3: (callback: () => void) => Unsubscribe
  onUndo: (callback: () => void) => Unsubscribe
  onRedo: (callback: () => void) => Unsubscribe
  onCut: (callback: () => void) => Unsubscribe
  onCopy: (callback: () => void) => Unsubscribe
  onPaste: (callback: () => void) => Unsubscribe
  onDuplicate: (callback: () => void) => Unsubscribe
  onDelete: (callback: () => void) => Unsubscribe
  onSelectAll: (callback: () => void) => Unsubscribe
  onSelectNextNote: (callback: () => void) => Unsubscribe
  onSelectPreviousNote: (callback: () => void) => Unsubscribe
  onTransposeUpOctave: (callback: () => void) => Unsubscribe
  onTransposeDownOctave: (callback: () => void) => Unsubscribe
  onTranspose: (callback: () => void) => Unsubscribe
  onQuantize: (callback: () => void) => Unsubscribe
  onVelocity: (callback: () => void) => Unsubscribe
  onOpenSetting: (callback: () => void) => Unsubscribe
  onOpenHelp: (callback: () => void) => Unsubscribe
  // tell to main process that the renderer process is ready
  ready: () => void
  // returns the index of the button clicked
  showMessageBox: (options: {
    message: string
    buttons: string[]
    type?: "none" | "info" | "error" | "question" | "warning"
  }) => Promise<number>
  showOpenDialog: () => Promise<{ path: string; content: ArrayBuffer } | null>
  showOpenDirectoryDialog: () => Promise<string | null>
  showSaveDialog: () => Promise<{ path: string } | null>
  saveFile: (path: string, data: ArrayBuffer) => Promise<void>
  readFile: (path: string) => Promise<ArrayBuffer>
  searchSoundFonts: (path: string) => Promise<string[]>
  addRecentDocument: (path: string) => void
  getArgument: () => Promise<string | null>
  closeMainWindow: () => void
}

