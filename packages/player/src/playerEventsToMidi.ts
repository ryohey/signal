import {
  MIDIBuilder,
  type MIDIMessageType,
  midiMessageTypes,
} from "spessasynth_core"
import type { PlayerEvent } from "./PlayerEvent.js"

function addEvent(midi: MIDIBuilder, track: number, e: PlayerEvent) {
  const ticks = e.tick
  switch (e.type) {
    case "channel": {
      const ch = e.channel
      switch (e.subtype) {
        case "noteOn":
          midi.addNoteOn(ticks, track, ch, e.noteNumber, e.velocity)
          break
        
        case "noteOff":
          midi.addNoteOff(ticks, track, ch, e.noteNumber, e.velocity)
          break
        
        case "controller":
          midi.addControllerChange(ticks, track, ch, e.controllerType, e.value)
          break
        
        case "programChange":
          midi.addProgramChange(ticks, track, ch, e.value)
          break
        
        case "pitchBend": {
          const v = e.value
          const lsb = v & 0x7f
          const msb = (v >> 7) & 0x7f
          midi.addPitchWheel(ticks, track, ch, msb, lsb)
          break
        }
        
        case "channelAftertouch":
          midi.addEvent(
            ticks,
            track,
            (midiMessageTypes.channelPressure | ch) as MIDIMessageType,
            [e.amount],
          )
          break
        
        case "noteAftertouch":
          midi.addEvent(
            ticks,
            track,
            (midiMessageTypes.polyPressure | ch) as MIDIMessageType,
            [e.noteNumber, e.amount],
          )
          break
      }
      return
    }
    
    case "dividedSysEx":
    case "sysEx":
      midi.addEvent(ticks, track, midiMessageTypes.systemExclusive, e.data)
      return
  }
}

export function playerEventsToMIDI(
  events: PlayerEvent[],
  timeDivision: number,
): MIDIBuilder {
  // No toSorted??
  const sorted = [...events].sort((a, b) => a.tick - b.tick)
  const midi = new MIDIBuilder({
    name: "Exported Signal Song",
    timeDivision,
    initialTempo: 120,
    format: 0,
  })
  for (const e of sorted) {
    if (e.type === "meta" && e.subtype === "setTempo") {
      const bpm = (60 * 1_000_000) / e.microsecondsPerBeat
      midi.addSetTempo(e.tick, bpm)
      continue
    }
    addEvent(midi, 0, e)
  }
  midi.flush()
  return midi
}
