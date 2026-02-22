import { describe, expect, it } from "vitest"
import { isChordSymbol, parseChord } from "../../src/parse/chord.js"

describe("parseChord", () => {
  describe("basic triads", () => {
    it("C = C major", () => {
      const c = parseChord("C")
      expect(c.root).toBe(0)
      expect(c.type).toBe("maj")
      expect(c.intervals).toEqual([0, 4, 7])
    })

    it("Dm = D minor", () => {
      const c = parseChord("Dm")
      expect(c.root).toBe(2)
      expect(c.type).toBe("min")
    })

    it("Em = E minor", () => {
      const c = parseChord("Em")
      expect(c.root).toBe(4)
      expect(c.type).toBe("min")
    })

    it("F = F major", () => {
      const c = parseChord("F")
      expect(c.root).toBe(5)
      expect(c.type).toBe("maj")
    })

    it("Gdim = G diminished", () => {
      const c = parseChord("Gdim")
      expect(c.root).toBe(7)
      expect(c.type).toBe("dim")
    })

    it("Aaug = A augmented", () => {
      const c = parseChord("Aaug")
      expect(c.root).toBe(9)
      expect(c.type).toBe("aug")
    })
  })

  describe("sharps and flats", () => {
    it("C# = C# major", () => {
      const c = parseChord("C#")
      expect(c.root).toBe(1)
      expect(c.type).toBe("maj")
    })

    it("Db = Db major", () => {
      const c = parseChord("Db")
      expect(c.root).toBe(1)
      expect(c.type).toBe("maj")
    })

    it("Ebm = Eb minor", () => {
      const c = parseChord("Ebm")
      expect(c.root).toBe(3)
      expect(c.type).toBe("min")
    })

    it("F#m = F# minor", () => {
      const c = parseChord("F#m")
      expect(c.root).toBe(6)
      expect(c.type).toBe("min")
    })

    it("Bbmaj7 = Bb major 7", () => {
      const c = parseChord("Bbmaj7")
      expect(c.root).toBe(10)
      expect(c.type).toBe("maj7")
    })
  })

  describe("seventh chords", () => {
    it("Cmaj7", () => {
      const c = parseChord("Cmaj7")
      expect(c.root).toBe(0)
      expect(c.type).toBe("maj7")
      expect(c.intervals).toEqual([0, 4, 7, 11])
    })

    it("G7", () => {
      const c = parseChord("G7")
      expect(c.root).toBe(7)
      expect(c.type).toBe("7")
    })

    it("Am7 = A minor 7", () => {
      const c = parseChord("Am7")
      expect(c.root).toBe(9)
      expect(c.type).toBe("min7")
    })

    it("Bdim7", () => {
      const c = parseChord("Bdim7")
      expect(c.root).toBe(11)
      expect(c.type).toBe("dim7")
    })

    it("Cm7b5", () => {
      const c = parseChord("Cm7b5")
      expect(c.root).toBe(0)
      expect(c.type).toBe("m7b5")
    })
  })

  describe("extended chords", () => {
    it("C9", () => {
      const c = parseChord("C9")
      expect(c.root).toBe(0)
      expect(c.type).toBe("9")
      expect(c.intervals).toEqual([0, 4, 7, 10, 14])
    })

    it("Fmaj9", () => {
      const c = parseChord("Fmaj9")
      expect(c.root).toBe(5)
      expect(c.type).toBe("maj9")
    })

    it("Bb13", () => {
      const c = parseChord("Bb13")
      expect(c.root).toBe(10)
      expect(c.type).toBe("13")
    })
  })

  describe("sus and add chords", () => {
    it("Csus2", () => {
      const c = parseChord("Csus2")
      expect(c.root).toBe(0)
      expect(c.type).toBe("sus2")
    })

    it("Dsus4", () => {
      const c = parseChord("Dsus4")
      expect(c.root).toBe(2)
      expect(c.type).toBe("sus4")
    })

    it("Gadd9", () => {
      const c = parseChord("Gadd9")
      expect(c.root).toBe(7)
      expect(c.type).toBe("add9")
    })
  })

  describe("slash chords", () => {
    it("C/E = C major with E bass", () => {
      const c = parseChord("C/E")
      expect(c.root).toBe(0)
      expect(c.type).toBe("maj")
      expect(c.bass).toBe(4) // E
    })

    it("Am/G = A minor with G bass", () => {
      const c = parseChord("Am/G")
      expect(c.root).toBe(9)
      expect(c.type).toBe("min")
      expect(c.bass).toBe(7) // G
    })

    it("Dm7/C", () => {
      const c = parseChord("Dm7/C")
      expect(c.root).toBe(2)
      expect(c.type).toBe("min7")
      expect(c.bass).toBe(0) // C
    })

    it("throws on invalid bass note", () => {
      expect(() => parseChord("C/X")).toThrow()
    })
  })

  describe("case insensitivity", () => {
    it("cm = C minor", () => {
      const c = parseChord("cm")
      expect(c.root).toBe(0)
      expect(c.type).toBe("min")
    })

    it("CMAJ7 = C major 7", () => {
      const c = parseChord("CMAJ7")
      expect(c.root).toBe(0)
      expect(c.type).toBe("maj7")
    })
  })

  describe("errors", () => {
    it("throws on empty string", () => {
      expect(() => parseChord("")).toThrow()
    })

    it("throws on invalid root", () => {
      expect(() => parseChord("X")).toThrow()
    })

    it("throws on unknown suffix", () => {
      expect(() => parseChord("Cxyz")).toThrow()
    })
  })
})

describe("isChordSymbol", () => {
  it("recognizes basic chords", () => {
    expect(isChordSymbol("C")).toBe(true)
    expect(isChordSymbol("Dm")).toBe(true)
    expect(isChordSymbol("Ebmaj7")).toBe(true)
    expect(isChordSymbol("F#sus4")).toBe(true)
  })

  it("rejects note+octave like C4", () => {
    expect(isChordSymbol("C4")).toBe(false)
    expect(isChordSymbol("Eb5")).toBe(false)
  })

  it("recognizes chords that end in digits", () => {
    expect(isChordSymbol("Cmaj7")).toBe(true)
    expect(isChordSymbol("Bb13")).toBe(true)
    expect(isChordSymbol("Am7")).toBe(true)
  })

  it("rejects pure numbers", () => {
    expect(isChordSymbol("60")).toBe(false)
    expect(isChordSymbol("127")).toBe(false)
  })
})
