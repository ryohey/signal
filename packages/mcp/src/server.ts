#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"
import { HeadlessSignal } from "./HeadlessSignal.js"
import { renderMidiAudio } from "./renderAudio.js"

const engine = new HeadlessSignal()
const server = new McpServer({ name: "signal-headless", version: "0.1.0" })

const result = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  structuredContent:
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : { value },
})

server.registerTool(
  "signal_get_project",
  {
    description:
      "Read the complete in-memory Signal project, including tracks and MIDI notes.",
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async () => result(engine.getState()),
)

server.registerTool(
  "signal_new_project",
  {
    description:
      "Replace the in-memory project with a new empty Signal project.",
    inputSchema: { name: z.string().optional() },
    annotations: { destructiveHint: true, openWorldHint: false },
  },
  async ({ name }) => result(engine.newProject(name)),
)

server.registerTool(
  "signal_import_midi",
  {
    description:
      "Load a local Standard MIDI file into the headless Signal engine.",
    inputSchema: { filePath: z.string(), name: z.string().optional() },
    annotations: { destructiveHint: true, openWorldHint: false },
  },
  async ({ filePath, name }) => {
    const bytes = await readFile(resolve(filePath))
    return result(engine.importMidi(bytes, name))
  },
)

server.registerTool(
  "signal_export_midi",
  {
    description:
      "Save the in-memory Signal project as a local Standard MIDI file.",
    inputSchema: { filePath: z.string() },
    annotations: {
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ filePath }) => {
    const outputPath = resolve(filePath)
    await writeFile(outputPath, engine.midiBytes)
    return result({
      filePath: outputPath,
      byteLength: engine.midiBytes.byteLength,
    })
  },
)

server.registerTool(
  "signal_add_track",
  {
    description:
      "Add a MIDI track. Channels are zero-based; drums normally use channel 9.",
    inputSchema: {
      name: z.string().optional(),
      channel: z.number().int().min(0).max(15).optional(),
    },
    annotations: { destructiveHint: false, openWorldHint: false },
  },
  async (args) => result(engine.addTrack(args)),
)

server.registerTool(
  "signal_track",
  {
    description:
      "Update, duplicate, or delete a MIDI track in the headless project.",
    inputSchema: {
      action: z.enum(["update", "duplicate", "delete"]),
      trackId: z.number().int(),
      name: z.string().optional(),
      channel: z.number().int().min(0).max(15).optional(),
      program: z.number().int().min(0).max(127).optional(),
      volume: z.number().int().min(0).max(127).optional(),
      pan: z.number().int().min(0).max(127).optional(),
    },
    annotations: { destructiveHint: true, openWorldHint: false },
  },
  async ({ action, trackId, ...values }) => {
    if (action === "duplicate") return result(engine.duplicateTrack(trackId))
    if (action === "delete") return result(engine.deleteTrack(trackId))
    return result(engine.updateTrack(trackId, values))
  },
)

const noteSchema = z.object({
  tick: z.number().int().min(0),
  duration: z.number().int().positive(),
  noteNumber: z.number().int().min(0).max(127),
  velocity: z.number().int().min(1).max(127).optional(),
})

server.registerTool(
  "signal_add_notes",
  {
    description: "Add one or more MIDI notes to a track.",
    inputSchema: {
      trackId: z.number().int(),
      notes: z.array(noteSchema).min(1),
    },
    annotations: { destructiveHint: false, openWorldHint: false },
  },
  async ({ trackId, notes }) => result(engine.addNotes(trackId, notes)),
)

server.registerTool(
  "signal_edit_notes",
  {
    description:
      "Update, delete, duplicate, transpose, or quantize existing MIDI notes.",
    inputSchema: {
      action: z.enum([
        "update",
        "delete",
        "duplicate",
        "transpose",
        "quantize",
      ]),
      trackId: z.number().int(),
      noteIds: z.array(z.number().int()).optional(),
      notes: z
        .array(
          z.object({
            id: z.number().int(),
            tick: z.number().int().min(0).optional(),
            duration: z.number().int().positive().optional(),
            noteNumber: z.number().int().min(0).max(127).optional(),
            velocity: z.number().int().min(1).max(127).optional(),
          }),
        )
        .optional(),
      deltaTick: z.number().int().optional(),
      semitones: z.number().int().optional(),
      gridTicks: z.number().int().positive().optional(),
    },
    annotations: { destructiveHint: true, openWorldHint: false },
  },
  async ({
    action,
    trackId,
    noteIds = [],
    notes = [],
    deltaTick,
    semitones,
    gridTicks,
  }) => {
    if (action === "update") return result(engine.updateNotes(trackId, notes))
    if (action === "delete") return result(engine.deleteNotes(trackId, noteIds))
    if (action === "duplicate") {
      return result(engine.duplicateNotes(trackId, noteIds, deltaTick ?? 0))
    }
    if (action === "transpose") {
      if (semitones === undefined)
        throw new Error("semitones is required for transpose")
      return result(engine.transposeNotes(trackId, noteIds, semitones))
    }
    if (gridTicks === undefined)
      throw new Error("gridTicks is required for quantize")
    return result(engine.quantizeNotes(trackId, noteIds, gridTicks))
  },
)

server.registerTool(
  "signal_set_musical_settings",
  {
    description: "Set project metadata, tempo, or time signature.",
    inputSchema: {
      kind: z.enum(["project", "tempo", "time_signature"]),
      name: z.string().optional(),
      timebase: z.number().int().positive().optional(),
      bpm: z.number().positive().max(999).optional(),
      numerator: z.number().int().positive().optional(),
      denominator: z.number().int().positive().optional(),
      tick: z.number().int().min(0).optional(),
    },
    annotations: { destructiveHint: false, openWorldHint: false },
  },
  async ({ kind, tick = 0, ...values }) => {
    if (kind === "project") return result(engine.setProject(values))
    if (kind === "tempo") {
      if (values.bpm === undefined) throw new Error("bpm is required for tempo")
      return result(engine.setTempo(values.bpm, tick))
    }
    if (values.numerator === undefined || values.denominator === undefined) {
      throw new Error(
        "numerator and denominator are required for time_signature",
      )
    }
    return result(
      engine.setTimeSignature(values.numerator, values.denominator, tick),
    )
  },
)

server.registerTool(
  "signal_history",
  {
    description: "Undo or redo the latest headless project edit.",
    inputSchema: { action: z.enum(["undo", "redo"]) },
    annotations: { destructiveHint: true, openWorldHint: false },
  },
  async ({ action }) =>
    result(action === "undo" ? engine.undo() : engine.redo()),
)

server.registerTool(
  "signal_export_audio",
  {
    description:
      "Render the in-memory project or a local MIDI file headlessly through a SoundFont and save MP3 or WAV.",
    inputSchema: {
      filePath: z.string(),
      midiFilePath: z.string().optional(),
      soundFontPath: z.string().optional(),
      format: z.enum(["mp3", "wav"]),
      durationSeconds: z.number().positive().max(3600).optional(),
      sampleRate: z
        .union([z.literal(22050), z.literal(44100), z.literal(48000)])
        .optional(),
      bitrateKbps: z
        .union([
          z.literal(96),
          z.literal(128),
          z.literal(192),
          z.literal(256),
          z.literal(320),
        ])
        .optional(),
    },
    annotations: {
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ midiFilePath, ...options }) => {
    const midiBytes = midiFilePath
      ? await readFile(resolve(midiFilePath))
      : engine.midiBytes
    return result(await renderMidiAudio(midiBytes, options))
  },
)

await server.connect(new StdioServerTransport())
