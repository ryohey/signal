import { Range } from "@signal-app/core"
import { Measure } from "../measure/Measure"
import { Beat } from "./Beat"

describe("createBeatsInRange", () => {
  const timebase = 480

  it("should create beats", () => {
    const measures: Measure[] = [
      { tick: 0, measure: 0, numerator: 4, denominator: 4 },
      { tick: timebase * 4, measure: 1, numerator: 6, denominator: 8 },
      { tick: timebase * 7, measure: 2, numerator: 3, denominator: 4 },
    ]

    const beats = Beat.createInRange(
      measures,
      timebase,
      Range.create(0, timebase * 15),
    )

    expect(beats).toStrictEqual([
      // first measure (4/4)
      { measure: 0, beat: 0, tick: 0 },
      { measure: 0, beat: 1, tick: timebase },
      { measure: 0, beat: 2, tick: timebase * 2 },
      { measure: 0, beat: 3, tick: timebase * 3 },

      // second measure (6/8)
      { measure: 1, beat: 0, tick: timebase * 4 },
      { measure: 1, beat: 1, tick: timebase * 4.5 },
      { measure: 1, beat: 2, tick: timebase * 5 },
      { measure: 1, beat: 3, tick: timebase * 5.5 },
      { measure: 1, beat: 4, tick: timebase * 6 },
      { measure: 1, beat: 5, tick: timebase * 6.5 },

      // third measure (3/4)
      { measure: 2, beat: 0, tick: timebase * 7 },
      { measure: 2, beat: 1, tick: timebase * 8 },
      { measure: 2, beat: 2, tick: timebase * 9 },

      // fourth measure (3/4)
      { measure: 3, beat: 0, tick: timebase * 10 },
      { measure: 3, beat: 1, tick: timebase * 11 },
      { measure: 3, beat: 2, tick: timebase * 12 },

      // fifth measure (3/4)
      { measure: 4, beat: 0, tick: timebase * 13 },
      { measure: 4, beat: 1, tick: timebase * 14 },
    ])
  })

  it("should create default beats without the initial measure", () => {
    const measures: Measure[] = [
      {
        tick: timebase * 4, // starts at out of the range
        measure: 0,
        numerator: 5,
        denominator: 8,
      },
    ]
    const beats = Beat.createInRange(
      measures,
      timebase,
      Range.create(0, timebase * 4),
    )
    expect(beats).toStrictEqual([
      { measure: 0, beat: 0, tick: 0 },
      { measure: 0, beat: 1, tick: timebase },
      { measure: 0, beat: 2, tick: timebase * 2 },
      { measure: 0, beat: 3, tick: timebase * 3 },
    ])
  })
})
