import {
  MIDIDeviceStore,
  MIDIInput,
  NoteEvent,
  SongStore,
  Track,
  TrackEvent,
  TrackId,
  UNASSIGNED_TRACK_ID,
} from "@signal-app/core"
import { Player } from "@signal-app/player"

export class MIDIRecorder {
  trackId: TrackId = UNASSIGNED_TRACK_ID
  private stopRecording: (() => void) | null = null
  private isRecordingListeners = new Set<() => void>()
  readonly onIsRecordingChanged = {
    subscribe: (callback: () => void) => {
      this.isRecordingListeners.add(callback)
      return () => {
        this.isRecordingListeners.delete(callback)
      }
    },
  }

  constructor(
    private readonly songStore: SongStore,
    private readonly player: Player,
    private readonly midiDeviceStore: MIDIDeviceStore,
    private readonly midiInput: MIDIInput,
  ) {}

  get isRecording() {
    return this.stopRecording !== null
  }

  start() {
    const { player } = this

    this.stop()

    const recordedNotes: { [key: TrackId]: NoteEvent[] } = {}

    const unsubscribeMidiInput = this.midiInput.on("midiMessage", (e) => {
      if (!this.isRecording) {
        return
      }

      const message = e.message

      if (message.type !== "channel") {
        return
      }

      const tick = Math.floor(this.player.position)

      const routing = this.midiDeviceStore.midiInputRouting

      let tracks: Track[]
      if (routing === "channelRouting") {
        tracks = this.songStore.song.tracks.filter(
          (t) => !t.isConductorTrack && t.channel === message.channel,
        )
      } else {
        // selectedTrack mode
        const track = this.songStore.song.getTrack(this.trackId)
        tracks = track !== undefined ? [track] : []
      }

      switch (message.subtype) {
        case "noteOn": {
          tracks.forEach((track) => {
            const note = track.addEvent<NoteEvent>({
              type: "channel",
              subtype: "note",
              noteNumber: message.noteNumber,
              tick,
              velocity: message.velocity,
              duration: 0,
              isRecording: true,
            })
            if (recordedNotes[track.id] === undefined) {
              recordedNotes[track.id] = []
            }
            recordedNotes[track.id].push(note)
          })
          break
        }
        case "noteOff": {
          tracks.forEach((track) => {
            const recordedNotesForTrack = recordedNotes[track.id] ?? []

            recordedNotesForTrack
              .filter((n) => n.noteNumber === message.noteNumber)
              .forEach((n) => {
                track.updateEvent<NoteEvent>(n.id, {
                  duration: Math.max(0, tick - n.tick),
                })
              })

            recordedNotes[track.id] = recordedNotesForTrack.filter(
              (n) => n.noteNumber !== message.noteNumber,
            )
          })
          break
        }
        default: {
          tracks.forEach((track) => {
            track.addEvent({ ...message, tick, isRecording: true })
          })
          break
        }
      }
    })

    // extend duration while key press
    const unsubscribePlayer = player.onPositionChanged.subscribe(() => {
      const tick = Math.floor(player.position)

      Object.entries(recordedNotes).forEach(([trackId, notes]) => {
        const track = this.songStore.song.getTrack(
          parseInt(trackId, 10) as TrackId,
        )
        if (track === undefined) {
          return
        }
        notes.forEach((n) => {
          track.updateEvent<NoteEvent>(n.id, {
            duration: Math.max(0, tick - n.tick),
          })
        })
      })
    })

    this.stopRecording = () => {
      unsubscribeMidiInput()
      unsubscribePlayer()

      // stop recording
      this.songStore.song.tracks.forEach((track) => {
        const events = track.events
          .filter((e) => e.isRecording === true)
          .map<Partial<TrackEvent>>((e) => ({ ...e, isRecording: false }))
        track.updateEvents(events)
      })
      this.emitIsRecordingChanged()
    }

    this.emitIsRecordingChanged()
  }

  stop() {
    this.stopRecording?.()
    this.stopRecording = null
  }

  private emitIsRecordingChanged() {
    this.isRecordingListeners.forEach((callback) => callback())
  }
}
