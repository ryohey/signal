interface Serializable<T> {
  serialize(): T
  restore(serialized: T): void
}

export default class HistoryStore<State> {
  private undoHistory: State[] = []
  private redoHistory: State[] = []

  constructor(private readonly serializable: Serializable<State>) {}

  push() {
    const currentState = this.serializable.serialize()
    this.undoHistory.push(currentState)
    this.redoHistory = []
  }

  get hasUndo() {
    return this.undoHistory.length > 0
  }

  undo() {
    const currentState = this.serializable.serialize()
    const state = this.undoHistory.pop()
    if (state) {
      this.redoHistory.push(currentState)
      this.serializable.restore(state)
    }
  }

  get hasRedo() {
    return this.redoHistory.length > 0
  }

  redo() {
    const currentState = this.serializable.serialize()
    const state = this.redoHistory.pop()
    if (state) {
      this.undoHistory.push(currentState)
      this.serializable.restore(state)
    }
  }

  clear() {
    this.undoHistory = []
    this.redoHistory = []
  }
}
