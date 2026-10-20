import {
  isNoteEvent,
  type MIDIInputEvent,
  SongStore,
  type Track,
} from "@signal-app/core"
import { Emitter } from "@signal-app/observable"
import { describe, expect, it } from "vitest"
import { MIDIRecorder } from "./MIDIRecorder"

type MIDIMessage = MIDIInputEvent["message"]

const noteOn = (noteNumber: number, velocity: number, channel = 0) =>
  ({
    type: "channel",
    subtype: "noteOn",
    channel,
    noteNumber,
    velocity,
    deltaTime: 0,
  }) satisfies MIDIMessage

const noteOff = (noteNumber: number, channel = 0) =>
  ({
    type: "channel",
    subtype: "noteOff",
    channel,
    noteNumber,
    velocity: 0,
    deltaTime: 0,
  }) satisfies MIDIMessage

const createRecorder = () => {
  const songStore = new SongStore()
  const player = { position: 0, onPositionChanged: new Emitter() }
  const midiDeviceStore = {
    midiInputRouting: "selectedTrack" as "selectedTrack" | "channelRouting",
  }
  const midiMessages = new Emitter<MIDIInputEvent>()
  const midiInput = {
    on: (_event: "midiMessage", callback: (e: MIDIInputEvent) => void) =>
      midiMessages.subscribe(callback),
  }
  const recorder = new MIDIRecorder(
    songStore,
    player,
    midiDeviceStore,
    midiInput,
  )
  const track = songStore.song.tracks[1]
  recorder.trackId = track.id

  const send = (message: MIDIMessage) => midiMessages.emit({ message })

  const moveTo = (tick: number) => {
    player.position = tick
    player.onPositionChanged.emit()
  }

  return { recorder, songStore, midiDeviceStore, track, send, moveTo }
}

const notesOf = (track: Track) => track.events.filter(isNoteEvent)

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
    send(noteOn(60, 100))
    moveTo(250)
    send(noteOff(60))

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
    send(noteOn(60, 100))
    moveTo(480)

    expect(notesOf(track)[0].duration).toBe(480)
  })

  it("clears the isRecording flag of recorded events on stop", () => {
    const { recorder, track, send } = createRecorder()

    recorder.start()
    send(noteOn(60, 100))
    recorder.stop()

    expect(notesOf(track)[0].isRecording).toBe(false)
  })

  it("ignores MIDI input after stop", () => {
    const { recorder, track, send } = createRecorder()

    recorder.start()
    recorder.stop()
    send(noteOn(60, 100))

    expect(notesOf(track)).toHaveLength(0)
  })

  it("records into tracks matching the channel with channelRouting", () => {
    const { recorder, songStore, midiDeviceStore, track, send } =
      createRecorder()
    songStore.song.addNewTrack()
    const otherTrack = songStore.song.tracks[2]
    otherTrack.channel = 1
    midiDeviceStore.midiInputRouting = "channelRouting"

    recorder.start()
    send(noteOn(60, 100, 1))

    expect(notesOf(track)).toHaveLength(0)
    expect(notesOf(otherTrack)).toHaveLength(1)
  })
})
