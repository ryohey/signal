import { ControllerEvent } from "midifile-ts"
import { describe, expect, it } from "vitest"
import { isPanEvent, isVolumeEvent } from "../event/identify"
import { NoteEvent, TrackEventOf } from "../event/TrackEvent"
import { Track } from "./Track"
import { emptyTrack } from "./TrackFactory"

describe("Track", () => {
  it("should be serializable", () => {
    const track = new Track()
    track.channel = 5
    track.addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      duration: 120,
      tick: 123,
      velocity: 100,
      noteNumber: 100,
    })
    const s = track.serialize()
    const t = Track.deserialize(s)
    expect(t.channel).toBe(5)
    expect(t.endOfTrack).toBe(track.endOfTrack)
    expect(t.events.length).toBe(1)
    expect(t.events[0].tick).toBe(123)
  })

  it("should serialize to a POJO", () => {
    const track = new Track()
    track.channel = 5
    track.addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      duration: 120,
      tick: 123,
      velocity: 100,
      noteNumber: 100,
    })

    expect(track.serialize()).toStrictEqual({
      id: track.id,
      _events: {
        array: track.events,
        descending: false,
        lookupMap: track.events,
        lastEventId: 1,
      },
      channel: 5,
      endOfTrack: track.endOfTrack,
    })
  })

  it("should deserialize from its own serialized POJO", () => {
    const track = new Track()
    track.channel = 5
    track.addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      duration: 120,
      tick: 123,
      velocity: 100,
      noteNumber: 100,
    })

    const restored = Track.deserialize(track.serialize())

    expect(restored.serialize()).toStrictEqual(track.serialize())
  })
  it("endOfTrack() should reset end of track after note deletion", () => {
    const track = emptyTrack(5)
    const noteEvent = track.addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      duration: 120,
      tick: 123,
      velocity: 100,
      noteNumber: 100,
    })
    expect(track.endOfTrack).toBe(243)
    track.removeEvent(noteEvent.id)
    track.updateEndOfTrack()
    expect(track.endOfTrack).toBe(0)
  })
  it("should update color after setColor", () => {
    const track = emptyTrack(1)
    expect(track.color).toBe(undefined)
    track.setColor({
      red: 255,
      green: 128,
      blue: 92,
      alpha: 1,
    })
    expect(track.color).toMatchObject({
      red: 255,
      green: 128,
      blue: 92,
      alpha: 1,
    })
  })

  it("should notify channel and track type changes", () => {
    const track = new Track()
    let channelChanges = 0
    let conductorChanges = 0
    let rhythmChanges = 0

    track.onChannelChanged.subscribe(() => channelChanges++)
    track.onIsConductorTrackChanged.subscribe(() => conductorChanges++)
    track.onIsRhythmTrackChanged.subscribe(() => rhythmChanges++)

    track.channel = 1
    track.channel = 9
    track.channel = 9
    track.channel = undefined

    expect(channelChanges).toBe(3)
    expect(conductorChanges).toBe(2)
    expect(rhythmChanges).toBe(2)
  })

  it("should notify onChanged for non-derived state changes", () => {
    const track = new Track()
    let changes = 0

    track.onChanged.subscribe(() => changes++)

    track.id = 1 as Track["id"]
    track.channel = 1
    track.addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      duration: 120,
      tick: 123,
      velocity: 100,
      noteNumber: 100,
    })

    expect(changes).toBe(3)
  })

  it("should observe event changes by predicate", () => {
    const track = emptyTrack(1)
    let panChanges = 0
    let volumeChanges = 0

    const unsubscribePan = track.subscribeEventsChanged(
      isPanEvent,
      () => panChanges++,
    )
    const unsubscribeVolume = track.subscribeEventsChanged(
      isVolumeEvent,
      () => volumeChanges++,
    )

    track.addEvent<TrackEventOf<ControllerEvent>>({
      type: "channel",
      subtype: "controller",
      tick: 0,
      controllerType: 10,
      value: 90,
    })
    track.addEvent<TrackEventOf<ControllerEvent>>({
      type: "channel",
      subtype: "controller",
      tick: 0,
      controllerType: 7,
      value: 50,
    })

    expect(panChanges).toBe(1)
    expect(volumeChanges).toBe(1)

    unsubscribePan()
    unsubscribeVolume()
  })

  it("should not notify predicate observers for non-matching events", () => {
    const track = emptyTrack(1)
    let panChanges = 0

    const unsubscribePan = track.subscribeEventsChanged(
      isPanEvent,
      () => panChanges++,
    )

    track.addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      tick: 0,
      duration: 120,
      velocity: 100,
      noteNumber: 60,
    })

    expect(panChanges).toBe(0)

    unsubscribePan()
  })

  it("should notify multiple listeners subscribed to the same predicate", () => {
    const track = emptyTrack(1)
    let firstListenerChanges = 0
    let secondListenerChanges = 0

    const unsubscribeFirst = track.subscribeEventsChanged(
      isPanEvent,
      () => firstListenerChanges++,
    )
    const unsubscribeSecond = track.subscribeEventsChanged(
      isPanEvent,
      () => secondListenerChanges++,
    )

    track.addEvent<TrackEventOf<ControllerEvent>>({
      type: "channel",
      subtype: "controller",
      tick: 0,
      controllerType: 10,
      value: 64,
    })

    expect(firstListenerChanges).toBe(1)
    expect(secondListenerChanges).toBe(1)

    unsubscribeFirst()
    unsubscribeSecond()
  })

  it("should continue notifying after unsubscribe and re-subscribe", () => {
    const track = emptyTrack(1)
    let changes = 0

    const unsubscribeFirst = track.subscribeEventsChanged(
      isPanEvent,
      () => changes++,
    )

    unsubscribeFirst()

    const unsubscribeSecond = track.subscribeEventsChanged(
      isPanEvent,
      () => changes++,
    )

    track.addEvent<TrackEventOf<ControllerEvent>>({
      type: "channel",
      subtype: "controller",
      tick: 0,
      controllerType: 10,
      value: 80,
    })

    expect(changes).toBe(1)

    unsubscribeSecond()
  })
})
