import { action, makeObservable, observable } from "mobx"
import { makePersistable } from "mobx-persist-store"
import { mobxToObservable } from "../helpers/mobxToObservable"
import { Observable } from "../helpers/observable"

export class MIDIDeviceStore {
  enabledOutputs: { [deviceId: string]: boolean } = {}
  enabledInputs: { [deviceId: string]: boolean } = {}
  isFactorySoundEnabled = true
  midiInputRouting: "selectedTrack" | "channelRouting" = "selectedTrack"

  readonly onEnabledOutputsChanged: Observable
  readonly onEnabledInputsChanged: Observable
  readonly onIsFactorySoundEnabledChanged: Observable
  readonly onMidiInputRoutingChanged: Observable

  constructor() {
    makeObservable(this, {
      enabledOutputs: observable,
      enabledInputs: observable,
      isFactorySoundEnabled: observable,
      midiInputRouting: observable,
      setInputEnable: action,
      setOutputEnable: action,
      setMidiInputRouting: action,
    })

    makePersistable(this, {
      name: "MIDIDeviceStore",
      properties: [
        "isFactorySoundEnabled",
        "enabledOutputs",
        "enabledInputs",
        "midiInputRouting",
      ],
      storage: window.localStorage,
    })

    this.onEnabledOutputsChanged = mobxToObservable(this, "enabledOutputs")
    this.onEnabledInputsChanged = mobxToObservable(this, "enabledInputs")
    this.onIsFactorySoundEnabledChanged = mobxToObservable(
      this,
      "isFactorySoundEnabled",
    )
    this.onMidiInputRoutingChanged = mobxToObservable(this, "midiInputRouting")
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
