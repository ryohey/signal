import { describe, expect, it } from "vitest"
import { parseDegree } from "../../src/theory/Degree.js"

describe("parseDegree", () => {
  describe("major key diatonic degrees", () => {
    // Key of C (0), major scale
    it("I in C major = C major", () => {
      const d = parseDegree("I", 0, "major")
      expect(d.root).toBe(0) // C
      expect(d.chordType).toBe("maj")
      expect(d.degree).toBe(1)
    })

    it("ii in C major = D minor", () => {
      const d = parseDegree("ii", 0, "major")
      expect(d.root).toBe(2) // D
      expect(d.chordType).toBe("min")
      expect(d.degree).toBe(2)
    })

    it("iii in C major = E minor", () => {
      const d = parseDegree("iii", 0, "major")
      expect(d.root).toBe(4) // E
      expect(d.chordType).toBe("min")
      expect(d.degree).toBe(3)
    })

    it("IV in C major = F major", () => {
      const d = parseDegree("IV", 0, "major")
      expect(d.root).toBe(5) // F
      expect(d.chordType).toBe("maj")
      expect(d.degree).toBe(4)
    })

    it("V in C major = G major", () => {
      const d = parseDegree("V", 0, "major")
      expect(d.root).toBe(7) // G
      expect(d.chordType).toBe("maj")
      expect(d.degree).toBe(5)
    })

    it("vi in C major = A minor", () => {
      const d = parseDegree("vi", 0, "major")
      expect(d.root).toBe(9) // A
      expect(d.chordType).toBe("min")
      expect(d.degree).toBe(6)
    })

    it("vii in C major = B diminished", () => {
      const d = parseDegree("vii", 0, "major")
      expect(d.root).toBe(11) // B
      expect(d.chordType).toBe("dim")
      expect(d.degree).toBe(7)
    })
  })

  describe("different keys", () => {
    it("I in G major (key=7) = G major", () => {
      const d = parseDegree("I", 7, "major")
      expect(d.root).toBe(7) // G
      expect(d.chordType).toBe("maj")
    })

    it("V in G major = D major", () => {
      const d = parseDegree("V", 7, "major")
      expect(d.root).toBe(2) // D
      expect(d.chordType).toBe("maj")
    })

    it("IV in Eb major (key=3) = Ab major", () => {
      const d = parseDegree("IV", 3, "major")
      expect(d.root).toBe(8) // Ab
      expect(d.chordType).toBe("maj")
    })
  })

  describe("accidentals", () => {
    it("bVII in C major = Bb major", () => {
      const d = parseDegree("bVII", 0, "major")
      expect(d.root).toBe(10) // Bb
      expect(d.chordType).toBe("maj")
    })

    it("#iv in C major = F# minor", () => {
      const d = parseDegree("#iv", 0, "major")
      expect(d.root).toBe(6) // F#
      expect(d.chordType).toBe("min")
    })
  })

  describe("with chord quality suffix", () => {
    it("V7 in C major = G dominant 7", () => {
      const d = parseDegree("V7", 0, "major")
      expect(d.root).toBe(7)
      expect(d.chordType).toBe("7")
    })

    it("Imaj7 in C major = C major 7", () => {
      const d = parseDegree("Imaj7", 0, "major")
      expect(d.root).toBe(0)
      expect(d.chordType).toBe("maj7")
    })

    it("iimin7 in C major = D minor 7", () => {
      const d = parseDegree("iimin7", 0, "major")
      expect(d.root).toBe(2)
      expect(d.chordType).toBe("min7")
    })
  })

  describe("diminished symbol", () => {
    it("vii° in C major = B dim", () => {
      const d = parseDegree("vii°", 0, "major")
      expect(d.root).toBe(11)
      expect(d.chordType).toBe("dim")
    })
  })

  describe("minor key", () => {
    it("i in A minor = A minor", () => {
      const d = parseDegree("i", 9, "minor")
      expect(d.root).toBe(9)
      expect(d.chordType).toBe("min")
    })

    it("III in A minor = C major", () => {
      const d = parseDegree("III", 9, "minor")
      expect(d.root).toBe(0) // C
      expect(d.chordType).toBe("maj")
    })

    it("V in A minor = E minor", () => {
      const d = parseDegree("V", 9, "minor")
      expect(d.root).toBe(4) // E
      expect(d.chordType).toBe("min")
    })
  })

  describe("errors", () => {
    it("throws on invalid numeral", () => {
      expect(() => parseDegree("X", 0, "major")).toThrow()
    })

    it("throws on empty string", () => {
      expect(() => parseDegree("", 0, "major")).toThrow()
    })
  })
})
