import { makeObservable, observable } from "mobx"

export class ExportStore {
  openExportDialog = false
  exportMode: "WAV" | "MP3" = "WAV"
  openExportProgressDialog = false
  progress = 0
  isCanceled = false

  constructor() {
    makeObservable(this, {
      openExportDialog: observable,
      openExportProgressDialog: observable,
      progress: observable,
      exportMode: observable,
    })
  }
}
