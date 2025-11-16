import { assemble, deassemble } from "./noteAssembler"

describe("deassemble", () => {
  it("should deassemble to two notes", () => {
    const note = {
      type: "channel",
      subtype: "note",
      noteNumber: 32,
      tick: 100,
      duration: 60,
      velocity: 50,
      channel: 3,
    }
    const result = deassemble(note)
    expect(result.length).toBe(2)
    expect(result[0]).toStrictEqual({
      type: "channel",
      subtype: "noteOn",
      noteNumber: 32,
      deltaTime: 0,
      tick: 100,
      velocity: 50,
      channel: 3,
    })
    expect(result[1]).toStrictEqual({
      type: "channel",
      subtype: "noteOff",
      noteNumber: 32,
      deltaTime: 0,
      tick: 100 + 60,
      velocity: 0,
      channel: 3,
    })
  })
})

describe("assemble", () => {
  it("should assemble to an note", () => {
    const notes = [
      {
        type: "channel",
        subtype: "noteOn",
        noteNumber: 14,
        tick: 93,
        velocity: 120,
        channel: 5,
      },
      {
        type: "channel",
        subtype: "noteOff",
        noteNumber: 14,
        tick: 193,
        velocity: 0,
        channel: 5,
      },
    ]
    const result = assemble(notes)
    expect(result.length).toBe(1)
    expect(result[0]).toStrictEqual({
      id: -1,
      type: "channel",
      subtype: "note",
      noteNumber: 14,
      tick: 93,
      velocity: 120,
      channel: 5,
      duration: 100,
    })
  })
})
