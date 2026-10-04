import { Range } from "@signal-app/core"
import { describe, expect, it } from "vitest"
import { createTrackTempoEditor } from "../testUtils"
import {
  getEventIdsInRange,
  getItemsByIds,
  getItemsClipboardData,
} from "./items"

describe("tempo editor queries", () => {
  it("getItemsByIds returns items in the requested id order", () => {
    const editor = createTrackTempoEditor([
      { tick: 10, bpm: 120 },
      { tick: 20, bpm: 150 },
    ])
    const items = editor.getItems()

    expect(getItemsByIds([items[1].id, items[0].id])(editor)).toEqual([
      items[1],
      items[0],
    ])
  })

  it("getEventIdsInRange returns ids of items within the tick range", () => {
    const editor = createTrackTempoEditor([
      { tick: 10, bpm: 120 },
      { tick: 20, bpm: 150 },
    ])
    const items = editor.getItems()

    expect(getEventIdsInRange(Range.create(10, 21))(editor)).toEqual([
      items[0].id,
      items[1].id,
    ])
  })

  it("copies normalized TempoItems", () => {
    const editor = createTrackTempoEditor([
      { tick: 20, bpm: 120 },
      { tick: 40, bpm: 150 },
    ])
    const items = editor.getItems()

    expect(
      getItemsClipboardData(items.map((item) => item.id))(editor),
    ).toMatchObject({
      type: "tempo_events",
      items: [
        { tick: 0, bpm: 120 },
        { tick: 20, bpm: 150 },
      ],
    })
  })
})
