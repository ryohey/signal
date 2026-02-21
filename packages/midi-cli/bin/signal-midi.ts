#!/usr/bin/env node

import { Command } from "commander"
import { durationCommand } from "../src/commands/duration.js"
import { filterCommand } from "../src/commands/filter.js"
import { getNotesCommand } from "../src/commands/getNotes.js"
import { humanizeCommand } from "../src/commands/humanize.js"
import { infoCommand } from "../src/commands/info.js"
import { invertCommand } from "../src/commands/invert.js"
import { loadCommand } from "../src/commands/load.js"
import { quantizeCommand } from "../src/commands/quantize.js"
import { quantizeTimeCommand } from "../src/commands/quantizeTime.js"
import { retrogradeCommand } from "../src/commands/retrograde.js"
import { saveCommand } from "../src/commands/save.js"
import { setNotesCommand } from "../src/commands/setNotes.js"
import { shiftCommand } from "../src/commands/shift.js"
import { transposeCommand } from "../src/commands/transpose.js"
import { velocityCommand } from "../src/commands/velocity.js"

const program = new Command()

program
  .name("signal-midi")
  .description(
    "Scriptable MIDI editing CLI for Signal. Pipe commands together for composable MIDI transformations.",
  )
  .version("0.0.1")

// ─── Source Commands ───

program
  .command("load")
  .description("Load a MIDI file and output notes as a NoteStream")
  .argument("<file>", "Path to MIDI file")
  .option("-t, --track <number>", "Track number (1-indexed)", "1")
  .action((file, options) => {
    loadCommand(file, options)
  })

program
  .command("get-notes")
  .description(
    "Filter notes from a piped NoteStream by position, pitch, or velocity",
  )
  .option("--from <position>", "Start position (e.g., m1-2, t480)")
  .option("--to <position>", "End position (e.g., m3-1, t1920)")
  .option("--pitch <range>", "Pitch range (e.g., 60-72, C4-C5)")
  .option("--velocity <range>", "Velocity range (e.g., 0-64)")
  .action(async (options) => {
    await getNotesCommand(options)
  })

// ─── Transform Commands ───

program
  .command("quantize")
  .description("Quantize note pitches to a scale (e.g., d-major, c-minor)")
  .requiredOption(
    "-s, --scale <key-scale>",
    "Scale to quantize to (e.g., d-major, eb-dorian)",
  )
  .option(
    "-d, --direction <dir>",
    "Rounding direction: nearest, up, down",
    "nearest",
  )
  .action(async (options) => {
    await quantizeCommand(options)
  })

program
  .command("quantize-time")
  .description("Quantize note timing to a rhythmic grid")
  .requiredOption(
    "-g, --grid <value>",
    "Grid value (e.g., 1/4, 1/8, 1/16, 1/4t)",
  )
  .option("--strength <percent>", "Quantize strength 0-100", "100")
  .action(async (options) => {
    await quantizeTimeCommand(options)
  })

program
  .command("transpose")
  .description("Shift note pitches by semitones")
  .argument("<semitones>", "Number of semitones (positive=up, negative=down)")
  .action(async (semitones) => {
    await transposeCommand(semitones)
  })

program
  .command("velocity")
  .description("Adjust note velocities")
  .argument("<operation>", "Operation: set, add, scale, ramp, random")
  .argument("[values...]", "Values for the operation")
  .action(async (operation, values) => {
    await velocityCommand(operation, values, {})
  })

program
  .command("shift")
  .description("Move notes in time")
  .argument("<amount>", "Shift amount (e.g., +120t, -1b, +2m)")
  .action(async (amount) => {
    await shiftCommand(amount)
  })

program
  .command("filter")
  .description(
    "Filter notes by criteria (use --invert to exclude matching notes)",
  )
  .option("--pitch <range>", "Pitch range (e.g., 60-72, C4-C5)")
  .option("--velocity <range>", "Velocity range (e.g., 0-64)")
  .option("--from <position>", "Start position")
  .option("--to <position>", "End position")
  .option("--invert", "Keep notes that do NOT match the criteria")
  .action(async (options) => {
    await filterCommand(options)
  })

program
  .command("duration")
  .description("Adjust note durations")
  .argument("<operation>", "Operation: set, scale, legato, staccato")
  .argument("[value]", "Value for the operation")
  .action(async (operation, value) => {
    await durationCommand(operation, value)
  })

program
  .command("humanize")
  .description("Add random timing and velocity variation")
  .option("--time <ticks>", "Maximum timing deviation in ticks")
  .option("--velocity <delta>", "Maximum velocity deviation")
  .action(async (options) => {
    await humanizeCommand(options)
  })

program
  .command("invert")
  .description("Mirror note pitches around an axis")
  .option(
    "--axis <noteNumber>",
    "MIDI note number to mirror around (default: midpoint of range)",
  )
  .action(async (options) => {
    await invertCommand(options)
  })

program
  .command("retrograde")
  .description("Reverse the order/timing of notes")
  .action(async () => {
    await retrogradeCommand()
  })

// ─── Sink Commands ───

program
  .command("set-notes")
  .description("Write piped notes back into a track in a MIDI file")
  .argument("<file>", "Path to MIDI file to modify")
  .option("-t, --track <number>", "Track number (1-indexed)", "1")
  .option("--from <position>", "Replace notes starting from this position")
  .option("--to <position>", "Replace notes up to this position")
  .option("--merge", "Merge with existing notes instead of replacing")
  .action(async (file, options) => {
    await setNotesCommand(file, options)
  })

program
  .command("save")
  .description("Save a piped NoteStream as a new MIDI file")
  .argument("<file>", "Output MIDI file path")
  .action(async (file) => {
    await saveCommand(file)
  })

// ─── Info Commands ───

program
  .command("info")
  .description("Display information about a MIDI file")
  .argument("<file>", "Path to MIDI file")
  .action((file) => {
    infoCommand(file)
  })

// Handle errors gracefully
program.exitOverride()

try {
  await program.parseAsync(process.argv)
} catch (err) {
  if (
    err instanceof Error &&
    "code" in err &&
    err.code === "commander.helpDisplayed"
  ) {
    process.exit(0)
  }
  if (err instanceof Error) {
    process.stderr.write(`Error: ${err.message}\n`)
  }
  process.exit(1)
}
