import {
  isNoteEvent,
  MIDIDeviceStore,
  MIDIInput,
  SongStore,
} from "@signal-app/core"
import { Emitter } from "@signal-app/observable"
import type { Player } from "@signal-app/player"
import { describe, expect, it } from "vitest"
import { MIDIRecorder } from "./MIDIRecorder"

const createRecorder = () => {
  const songStore = new SongStore()
  const onPositionChanged = new Emitter()
  const player = { position: 0, onPositionChanged }
  const midiDeviceStore = new MIDIDeviceStore()
  const midiInput = new MIDIInput(midiDeviceStore)
  const recorder = new MIDIRecorder(
    songStore,
    player as unknown as Player,
    midiDeviceStore,
    midiInput,
  )
  const track = songStore.song.tracks[1]
  recorder.trackId = track.id

  const send = (...data: number[]) =>
    midiInput.onMidiMessage({ data: new Uint8Array(data) })

  const moveTo = (tick: number) => {
    player.position = tick
    onPositionChanged.emit()
  }

  return { recorder, track, send, moveTo }
}

const notesOf = (track: ReturnType<typeof createRecorder>["track"]) =>
  track.events.filter(isNoteEvent)

describe("MIDIRecorder", () => {
  it("is not recording initially", () => {
    const { recorder } = createRecorder()
    expect(recorder.isRecording).toBe(false)
  })

  it("notifies listeners with the updated isRecording", () => {
    const { recorder } = createRecorder()
    const values: boolean[] = []
    recorder.onIsRecordingChanged.subscribe(() => {
      values.push(recorder.isRecording)
    })

    recorder.start()
    recorder.stop()

    expect(values).toEqual([true, false])
  })

  it("does not notify when stop is called while not recording", () => {
    const { recorder } = createRecorder()
    let count = 0
    recorder.onIsRecordingChanged.subscribe(() => {
      count++
    })

    recorder.stop()

    expect(count).toBe(0)
  })

  it("records notes into the selected track", () => {
    const { recorder, track, send, moveTo } = createRecorder()

    recorder.start()
    moveTo(100)
    send(0x90, 60, 100)
    moveTo(250)
    send(0x80, 60, 0)

    const [note] = notesOf(track)
    expect(note).toMatchObject({
      noteNumber: 60,
      tick: 100,
      velocity: 100,
      duration: 150,
      isRecording: true,
    })
  })

  it("extends the duration of held notes as the player advances", () => {
    const { recorder, track, send, moveTo } = createRecorder()

    recorder.start()
    send(0x90, 60, 100)
    moveTo(480)

    expect(notesOf(track)[0].duration).toBe(480)
  })

  it("clears the isRecording flag of recorded events on stop", () => {
    const { recorder, track, send } = createRecorder()

    recorder.start()
    send(0x90, 60, 100)
    recorder.stop()

    expect(notesOf(track)[0].isRecording).toBe(false)
  })

  it("ignores MIDI input after stop", () => {
    const { recorder, track, send } = createRecorder()

    recorder.start()
    recorder.stop()
    send(0x90, 60, 100)

    expect(notesOf(track)).toHaveLength(0)
  })
})
