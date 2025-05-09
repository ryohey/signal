import { makeObservable, observable } from "mobx"
import { SerializedRootStore } from "./RootStore"

export default class HistoryStore {
  undoHistory: readonly SerializedRootStore[] = []
  redoHistory: readonly SerializedRootStore[] = []

  constructor() {
    makeObservable(this, {
      undoHistory: observable.ref,
      redoHistory: observable.ref,
    })
  }
}
