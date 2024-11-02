import { mapFromSignalEvent, mapToSignalEvent } from "./signalEvents"

describe("signalEvents", () => {
  describe("mapToSignalEvent", () => {
    it("TrackColor", () => {
      const result = mapToSignalEvent({
        id: 0,
        tick: 0,
        type: "meta",
        subtype: "sequencerSpecific",
        data: [
          "S".charCodeAt(0),
          "i".charCodeAt(0),
          "g".charCodeAt(0),
          "n".charCodeAt(0),
          1,
          1,
          2,
          3,
          4,
        ],
      })
      expect(result).toMatchObject({
        subtype: "signal",
        signalEventType: "trackColor",
        alpha: 1,
        blue: 2,
        green: 3,
        red: 4,
      })
    })
  })
  describe("mapFromSignalEvent", () => {
    it("TrackColor", () => {
      const result = mapFromSignalEvent({
        id: 0,
        tick: 0,
        type: "channel",
        subtype: "signal",
        signalEventType: "trackColor",
        alpha: 1,
        blue: 2,
        green: 3,
        red: 4,
      })
      expect(result).toMatchObject({
        type: "meta",
        subtype: "sequencerSpecific",
        data: [
          "S".charCodeAt(0),
          "i".charCodeAt(0),
          "g".charCodeAt(0),
          "n".charCodeAt(0),
          1,
          1,
          2,
          3,
          4,
        ],
      })
    })
  })
})
