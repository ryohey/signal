import { readFile, stat } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, test } from "vitest"
import { HeadlessSignal } from "./HeadlessSignal.js"
import { renderMidiAudio } from "./renderAudio.js"

const createProject = () => {
  const engine = new HeadlessSignal()
  engine.newProject("Headless test")
  const trackId = engine
    .getState()
    .tracks.find((track) => !track.isConductor)?.id
  if (trackId === undefined) throw new Error("Editable track was not created")
  const noteIds = engine.addNotes(trackId, [
    { tick: 0, duration: 480, noteNumber: 60, velocity: 100 },
    { tick: 480, duration: 480, noteNumber: 64, velocity: 96 },
    { tick: 960, duration: 480, noteNumber: 67, velocity: 104 },
  ]).noteIds
  return { engine, trackId, noteIds }
}

describe("HeadlessSignal", () => {
  test("edits notes and preserves them through MIDI round-trip", () => {
    const { engine, trackId, noteIds } = createProject()
    engine.transposeNotes(trackId, noteIds, 12)
    engine.quantizeNotes(trackId, noteIds, 240)

    const imported = new HeadlessSignal()
    imported.importMidi(engine.midiBytes, "Round trip")
    const notes = imported.getState().tracks.flatMap((track) => track.notes)
    expect(notes.map((note) => note.noteNumber)).toEqual([72, 76, 79])
    expect(imported.getState().project.name).toBe("Round trip")
  })

  test("supports undo and redo", () => {
    const { engine, trackId, noteIds } = createProject()
    engine.transposeNotes(trackId, noteIds, 5)
    expect(
      engine.getState().tracks.flatMap((track) => track.notes)[0].noteNumber,
    ).toBe(65)
    engine.undo()
    expect(
      engine.getState().tracks.flatMap((track) => track.notes)[0].noteNumber,
    ).toBe(60)
    engine.redo()
    expect(
      engine.getState().tracks.flatMap((track) => track.notes)[0].noteNumber,
    ).toBe(65)
  })

  test("renders an actual MP3 without a browser", async () => {
    const { engine } = createProject()
    const filePath = join(tmpdir(), `signal-headless-${process.pid}.mp3`)
    const rendered = await renderMidiAudio(engine.midiBytes, {
      filePath,
      format: "mp3",
      durationSeconds: 1.5,
      sampleRate: 22050,
      bitrateKbps: 96,
    })
    const bytes = await readFile(filePath)
    expect(rendered.byteLength).toBeGreaterThan(1000)
    expect((await stat(filePath)).size).toBe(rendered.byteLength)
    expect(
      bytes.subarray(0, 3).toString("ascii") === "ID3" || bytes[0] === 0xff,
    ).toBe(true)
  }, 30_000)
})
