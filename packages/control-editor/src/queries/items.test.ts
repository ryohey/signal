import { describe, expect, it } from "vitest"
import { createTrackControlEditor } from "../testUtils"
import {
  getItemsByIds,
  getItemsClipboardData,
  getItemsInRangeWithPrevious,
} from "./items"

describe("control editor composed queries", () => {
  it("getItemsByIds returns items for known ids and skips missing ones", () => {
    const editor = createTrackControlEditor()
    const first = editor.addItem({ tick: 10, value: 64 })
    const second = editor.addItem({ tick: 20, value: 100 })

    expect(getItemsByIds([first.id, -1, second.id])(editor)).toStrictEqual([
      first,
      second,
    ])
  })

  it("getItemsClipboardData normalizes selected items to start at tick 0", () => {
    const editor = createTrackControlEditor({
      type: "controller",
      controllerType: 7,
    })
    const first = editor.addItem({ tick: 20, value: 64 })
    const second = editor.addItem({ tick: 40, value: 100 })

    expect(getItemsClipboardData([first.id, second.id])(editor)).toStrictEqual({
      type: "control_events",
      valueEventType: { type: "controller", controllerType: 7 },
      events: [
        { id: first.id, tick: 0, value: 64 },
        { id: second.id, tick: 20, value: 100 },
      ],
    })
  })

  it("getItemsClipboardData returns null for an empty selection", () => {
    const editor = createTrackControlEditor()

    expect(getItemsClipboardData([])(editor)).toBeNull()
  })

  it("getItemsInRangeWithPrevious includes the last item before the range", () => {
    const editor = createTrackControlEditor()
    editor.addItem({ tick: 0, value: 1 })
    editor.addItem({ tick: 10, value: 2 })
    editor.addItem({ tick: 20, value: 3 })

    const items = getItemsInRangeWithPrevious([15, 25])(editor)

    expect(items.map((item) => item.tick)).toStrictEqual([10, 20])
  })

  it("getItemsInRangeWithPrevious omits the previous item when none precedes the range", () => {
    const editor = createTrackControlEditor()
    editor.addItem({ tick: 20, value: 3 })

    const items = getItemsInRangeWithPrevious([0, 10])(editor)

    expect(items).toStrictEqual([])
  })
})
