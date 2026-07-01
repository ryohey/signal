import { Observable, ObservableValue } from "@signal-app/observable"

const STORAGE_KEY = "MIDIDeviceStore"
type MIDIInputRouting = "selectedTrack" | "channelRouting"
type PersistedState = {
  enabledOutputs: Record<string, boolean>
  enabledInputs: Record<string, boolean>
  isFactorySoundEnabled: boolean
  midiInputRouting: MIDIInputRouting
}

export class MIDIDeviceStore {
  private readonly _enabledOutputs = new ObservableValue<
    Record<string, boolean>
  >({})
  private readonly _enabledInputs = new ObservableValue<
    Record<string, boolean>
  >({})
  private readonly _isFactorySoundEnabled = new ObservableValue<boolean>(true)
  private readonly _midiInputRouting = new ObservableValue<MIDIInputRouting>(
    "selectedTrack",
  )

  constructor() {
    const persistedState = loadPersistedState()
    this._enabledOutputs.set(persistedState.enabledOutputs)
    this._enabledInputs.set(persistedState.enabledInputs)
    this._isFactorySoundEnabled.set(persistedState.isFactorySoundEnabled)
    this._midiInputRouting.set(persistedState.midiInputRouting)

    ;[
      this._enabledOutputs.onChanged,
      this._enabledInputs.onChanged,
      this._isFactorySoundEnabled.onChanged,
      this._midiInputRouting.onChanged,
    ].forEach((observable) => {
      observable.subscribe(() => {
        this.persistState()
      })
    })
  }

  get enabledOutputs(): Record<string, boolean> {
    return this._enabledOutputs.value
  }

  private set enabledOutputs(value: Record<string, boolean>) {
    this._enabledOutputs.set(value)
  }

  get onEnabledOutputsChanged(): Observable {
    return this._enabledOutputs.onChanged
  }

  get enabledInputs(): Record<string, boolean> {
    return this._enabledInputs.value
  }

  private set enabledInputs(value: Record<string, boolean>) {
    this._enabledInputs.set(value)
  }

  get onEnabledInputsChanged(): Observable {
    return this._enabledInputs.onChanged
  }

  get isFactorySoundEnabled(): boolean {
    return this._isFactorySoundEnabled.value
  }

  set isFactorySoundEnabled(value: boolean) {
    this._isFactorySoundEnabled.set(value)
  }

  get onIsFactorySoundEnabledChanged(): Observable {
    return this._isFactorySoundEnabled.onChanged
  }

  get midiInputRouting(): MIDIInputRouting {
    return this._midiInputRouting.value
  }

  private set midiInputRouting(value: MIDIInputRouting) {
    this._midiInputRouting.set(value)
  }

  get onMidiInputRoutingChanged(): Observable {
    return this._midiInputRouting.onChanged
  }

  private persistState() {
    savePersistedState({
      enabledOutputs: this.enabledOutputs,
      enabledInputs: this.enabledInputs,
      isFactorySoundEnabled: this.isFactorySoundEnabled,
      midiInputRouting: this.midiInputRouting,
    })
  }

  setInputEnable = (deviceId: string, enabled: boolean) => {
    this.enabledInputs = {
      ...this.enabledInputs,
      [deviceId]: enabled,
    }
  }

  setOutputEnable = (deviceId: string, enabled: boolean) => {
    this.enabledOutputs = {
      ...this.enabledOutputs,
      [deviceId]: enabled,
    }
  }

  setMidiInputRouting = (routing: "selectedTrack" | "channelRouting") => {
    this.midiInputRouting = routing
  }
}

function savePersistedState(state: PersistedState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function loadPersistedState(): PersistedState {
  const defaultState: PersistedState = {
    enabledOutputs: {},
    enabledInputs: {},
    isFactorySoundEnabled: true,
    midiInputRouting: "selectedTrack",
  }

  try {
    const json = window.localStorage.getItem(STORAGE_KEY)
    if (json === null) {
      return defaultState
    }
    const value = JSON.parse(json) as Partial<PersistedState>
    return {
      enabledOutputs: value.enabledOutputs ?? defaultState.enabledOutputs,
      enabledInputs: value.enabledInputs ?? defaultState.enabledInputs,
      isFactorySoundEnabled:
        value.isFactorySoundEnabled ?? defaultState.isFactorySoundEnabled,
      midiInputRouting: value.midiInputRouting ?? defaultState.midiInputRouting,
    }
  } catch {
    return defaultState
  }
}
