import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { Player } from "./Player"

describe("Player", () => {
  beforeEach(() => {
    vi.stubGlobal("window", globalThis)
    vi.useFakeTimers({
      toFake: [
        "setInterval",
        "clearInterval",
        "setTimeout",
        "clearTimeout",
        "Date",
        "performance",
      ],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  const createPlayer = () =>
    new Player(
      { activate: () => {}, sendEvent: () => {} },
      {
        timebase: 480,
        endOfSong: 999999,
        getEvents: () => [],
        getCurrentStateEvents: () => [],
      },
    )

  it("reports the audible position, not the end of the look-ahead window", () => {
    const player = createPlayer()
    player.play()
    vi.advanceTimersByTime(1000)

    // 120 BPM, timebase 480: 1 s of playback is 960 ticks. Events up to
    // 100 ms (96 ticks) ahead are already queued, but the playhead must not
    // show them as if they were being heard.
    expect(player.position).toBeLessThanOrEqual(960)
    expect(player.position).toBeGreaterThan(960 - 96 - 48)
    player.stop()
  })

  it("maps the position back to the loop end right after a loop jump", () => {
    const player = createPlayer()
    player.loop = { begin: 0, end: 960, enabled: true }
    player.play()
    // The scheduler wraps once its look-ahead window passes loop.end, while
    // the end of the loop is still the part being heard.
    vi.advanceTimersByTime(950)

    expect(player.position).toBeGreaterThan(960 - 96 - 48)
    expect(player.position).toBeLessThanOrEqual(960)
    player.stop()
  })
})
