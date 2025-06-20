import { EventScheduler } from "./EventScheduler"

describe("EventScheduler", () => {
  it("readNextEvents", () => {
    const events = [{ tick: 0 }, { tick: 100 }, { tick: 110 }]
    const s = new EventScheduler(
      (start, end) => filterEventsWithRange(events, start, end),
      () => [],
      0,
      480,
      100
    )

    // The first event is read within the look ahead time
    {
      const result = s.readNextEvents(120, 0)
      expect(result.length).toBe(1)
      expect(result[0].timestamp).toBe(0)
      expect(result[0].event).toBe(events[0])
    }

    // No events are returned if no time has passed since the last read
    {
      const result = s.readNextEvents(120, 0)
      expect(result.length).toBe(0)
    }

    // Subsequent events are returned after time has passed
    {
      const result = s.readNextEvents(120, 120)
      expect(result.length).toBe(2)
      expect(result[0].event).toBe(events[1])
      expect(result[0].timestamp).toBe(120)
      expect(result[1].event).toBe(events[2])
      expect(result[1].timestamp).toBe(120)
    }
  })
})

const filterEventsWithRange = <T extends { tick: number }>(
  events: T[],
  start: number,
  end: number
): T[] => events.filter((e) => e.tick >= start && e.tick < end)
