import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { readNoteStream, writeNoteStream } from "../io.js"
import type { NoteStream } from "../types.js"

const CLIPBOARD_PATH = path.join(os.tmpdir(), "signal-midi-clipboard.json")

export async function copyCommand(): Promise<void> {
  const stream = await readNoteStream()

  // Save to clipboard file
  fs.writeFileSync(CLIPBOARD_PATH, JSON.stringify(stream, null, 2))
  process.stderr.write(`Copied ${stream.notes.length} notes to clipboard\n`)

  // Pass through
  writeNoteStream(stream)
}

export async function cutCommand(): Promise<void> {
  const stream = await readNoteStream()

  // Save to clipboard file
  fs.writeFileSync(CLIPBOARD_PATH, JSON.stringify(stream, null, 2))
  process.stderr.write(`Cut ${stream.notes.length} notes to clipboard\n`)

  // Output empty stream (notes removed)
  writeNoteStream({ context: stream.context, notes: [] })
}

export interface PasteOptions {
  at?: string
  merge?: boolean
}

export async function pasteCommand(options: PasteOptions): Promise<void> {
  const stream = await readNoteStream()

  if (!fs.existsSync(CLIPBOARD_PATH)) {
    throw new Error("Clipboard is empty. Use copy or cut first.")
  }

  const clipboard: NoteStream = JSON.parse(
    fs.readFileSync(CLIPBOARD_PATH, "utf-8"),
  )

  let pastedNotes = clipboard.notes

  // Offset to paste position
  if (options.at) {
    const { parsePosition } = await import("../parse/position.js")
    const targetTick = parsePosition(
      options.at,
      stream.context.timebase,
      stream.context.measures,
    )
    const minTick =
      pastedNotes.length > 0 ? Math.min(...pastedNotes.map((n) => n.tick)) : 0
    const offset = targetTick - minTick
    pastedNotes = pastedNotes.map((n) => ({ ...n, tick: n.tick + offset }))
  }

  let notes: typeof stream.notes
  if (options.merge) {
    notes = [...stream.notes, ...pastedNotes]
    notes.sort((a, b) => a.tick - b.tick || a.noteNumber - b.noteNumber)
  } else {
    notes = pastedNotes
  }

  writeNoteStream({ context: stream.context, notes })
}
