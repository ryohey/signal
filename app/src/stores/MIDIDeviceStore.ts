import { action, makeObservable, observable } from "mobx"
import { makePersistable } from "mobx-persist-store"

export class MIDIDeviceStore {
  inputs: WebMidi.MIDIInput[] = []
  outputs: WebMidi.MIDIOutput[] = []
  requestError: Error | null = null
  isLoading = false
  enabledOutputs: { [deviceId: string]: boolean } = {}
  enabledInputs: { [deviceId: string]: boolean } = {}
  isFactorySoundEnabled = true

  constructor() {
    makeObservable(this, {
      inputs: observable,
      outputs: observable,
      requestError: observable,
      isLoading: observable,
      enabledOutputs: observable,
      enabledInputs: observable,
      isFactorySoundEnabled: observable,
      setInputEnable: action,
      setOutputEnable: action,
    })

    makePersistable(this, {
      name: "MIDIDeviceStore",
      properties: ["isFactorySoundEnabled", "enabledOutputs", "enabledInputs"],
      storage: window.localStorage,
    })

    this.requestMIDIAccess()
  }

  requestMIDIAccess = async () => {
    this.isLoading = true
    this.inputs = []
    this.outputs = []

    if (navigator.requestMIDIAccess === undefined) {
      this.isLoading = false
      this.requestError = new Error(
        "Web MIDI API is not supported by your browser",
      )
      return
    }

    try {
      const midiAccess = (await navigator.requestMIDIAccess({
        sysex: true,
      })) as WebMidi.MIDIAccess

      this.updatePorts(midiAccess)
      midiAccess.onstatechange = () => {
        this.updatePorts(midiAccess)
      }
    } catch (error) {
      this.requestError = error as Error
    } finally {
      this.isLoading = false
    }
  }

  private updatePorts(midiAccess: WebMidi.MIDIAccess) {
    this.inputs = Array.from(midiAccess.inputs.values())
    this.outputs = Array.from(midiAccess.outputs.values())
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
}
