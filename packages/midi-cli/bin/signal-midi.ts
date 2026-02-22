#!/usr/bin/env node

import { Command } from "commander"
import { addNotesCommand } from "../src/commands/addNotes.js"
import { analyzeCommand } from "../src/commands/analyze.js"
import { compressCommand } from "../src/commands/compress.js"
import { copyCommand, cutCommand, pasteCommand } from "../src/commands/copy.js"
import { durationCommand } from "../src/commands/duration.js"
import { filterCommand } from "../src/commands/filter.js"
import { genPatternCommand } from "../src/commands/genPattern.js"
import { getNotesCommand } from "../src/commands/getNotes.js"
import { harmonizeCommand } from "../src/commands/harmonize.js"
import { humanizeCommand } from "../src/commands/humanize.js"
import { infoCommand } from "../src/commands/info.js"
import { invertCommand } from "../src/commands/invert.js"
import { letCommand } from "../src/commands/let.js"
import { loadCommand } from "../src/commands/load.js"
import { quantizeCommand } from "../src/commands/quantize.js"
import { quantizeTimeCommand } from "../src/commands/quantizeTime.js"
import { removeCommand } from "../src/commands/remove.js"
import { repeatCommand } from "../src/commands/repeat.js"
import { retrogradeCommand } from "../src/commands/retrograde.js"
import { runCommand } from "../src/commands/run.js"
import { saveCommand } from "../src/commands/save.js"
import { setNotesCommand } from "../src/commands/setNotes.js"
import { shiftCommand } from "../src/commands/shift.js"
import { sliceCommand } from "../src/commands/slice.js"
import { spreadCommand } from "../src/commands/spread.js"
import { thinCommand } from "../src/commands/thin.js"
import { transposeCommand } from "../src/commands/transpose.js"
import { velocityCommand } from "../src/commands/velocity.js"
import { voiceLeadCommand } from "../src/commands/voiceLead.js"

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
  .option("--start <position>", "Alias for --from")
  .option("--to <position>", "End position (e.g., m3-1, t1920)")
  .option("--end <position>", "Alias for --to")
  .option("--pitch <range>", "Pitch range (e.g., 60-72, C4-C5)")
  .option("--velocity <range>", "Velocity range (e.g., 0-64)")
  .option("--nth <n>", "Select every Nth note")
  .option("--random <percent>", "Randomly select N% of notes")
  .option("--channel <n>", "Filter by MIDI channel")
  .action(async (options) => {
    await getNotesCommand({
      ...options,
      from: options.from ?? options.start,
      to: options.to ?? options.end,
    })
  })

// ─── Note Generation Commands ───

program
  .command("add-notes")
  .description(
    "Add notes or chords to the stream (e.g., add-notes C4 E4 G4, add-notes Cmaj7)",
  )
  .argument("[notes...]", "Note names (C4, Eb5) or chord symbols (Cmaj7, Dm)")
  .option("--at <position>", "Position to insert at (e.g., m1-1, t0)")
  .option("--duration <value>", "Note duration (e.g., 1/4, 1/8)", "1/4")
  .option("--each <value>", "Time between successive groups (e.g., 1/1)")
  .option("--velocity <n>", "Velocity (0-127)", "100")
  .option("--octave <n>", "Default octave for chord symbols", "4")
  .option("--strum <ticks>", "Strum offset between chord notes in ticks", "0")
  .option("--scale <key-scale>", "Generate scale notes (e.g., c-major)")
  .option("--degree <degrees...>", "Roman numeral degrees (e.g., I IV V I)")
  .option("--key <key-scale>", "Key for degree resolution (e.g., c-major)")
  .option("--rest", "Insert a rest (silence)")
  .option("--channel <n>", "MIDI channel")
  .action(async (notes, options) => {
    await addNotesCommand(notes, options)
  })

program
  .command("gen-pattern")
  .description("Generate repeating melodic/rhythmic patterns")
  .option("--arpeggio <chord>", "Chord to arpeggiate (e.g., Cmaj7)")
  .option("--notes <notes...>", "Note names to pattern (e.g., C4 E4 G4)")
  .option(
    "--pattern <dir>",
    "Pattern direction: up, down, updown, downup, random",
    "up",
  )
  .option("--duration <value>", "Note duration (e.g., 1/16)", "1/8")
  .option("--octaves <n>", "Number of octaves to span", "1")
  .option("--at <position>", "Start position")
  .option("--repeat <n>", "Number of repetitions", "1")
  .option("--velocity <n>", "Velocity (0-127)", "100")
  .option(
    "--rhythm <durations>",
    "Space-separated rhythm (e.g., '1/8 1/8 1/4')",
  )
  .option("--channel <n>", "MIDI channel")
  .action(async (options) => {
    await genPatternCommand(options)
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
  .option("--start <position>", "Alias for --from")
  .option("--to <position>", "End position")
  .option("--end <position>", "Alias for --to")
  .option("--invert", "Keep notes that do NOT match the criteria")
  .option("--nth <n>", "Select every Nth matching note")
  .option("--random <percent>", "Randomly select N% of matching notes")
  .option("--channel <n>", "Filter by MIDI channel")
  .action(async (options) => {
    await filterCommand({
      ...options,
      from: options.from ?? options.start,
      to: options.to ?? options.end,
    })
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

program
  .command("harmonize")
  .description("Add diatonic harmony notes")
  .requiredOption(
    "--interval <interval>",
    "Interval: 2nd, 3rd, 4th, 5th, 6th, 7th, octave",
  )
  .requiredOption("--key <key-scale>", "Key (e.g., c-major, d-minor)")
  .option("--chord", "Add full diatonic triad instead of single interval")
  .action(async (options) => {
    await harmonizeCommand(options)
  })

// ─── Section Operations ───

program
  .command("remove")
  .description("Remove matching notes from the stream")
  .option("--from <position>", "Start position")
  .option("--to <position>", "End position")
  .option("--pitch <range>", "Pitch range")
  .option("--velocity <range>", "Velocity range")
  .option("--nth <n>", "Remove every Nth matching note")
  .action(async (options) => {
    await removeCommand(options)
  })

program
  .command("slice")
  .description("Extract a section of notes")
  .option("--from <position>", "Start position")
  .option("--to <position>", "End position")
  .option("--zero", "Rebase extracted notes to tick 0")
  .action(async (options) => {
    await sliceCommand(options)
  })

program
  .command("repeat")
  .description("Repeat notes N times end-to-end")
  .argument("<count>", "Number of repetitions")
  .option("--gap <value>", "Gap between repetitions (e.g., 1/4)")
  .action(async (count, options) => {
    await repeatCommand(count, options)
  })

program
  .command("copy")
  .description("Copy current notes to clipboard")
  .action(async () => {
    await copyCommand()
  })

program
  .command("cut")
  .description("Cut current notes to clipboard (removes from stream)")
  .action(async () => {
    await cutCommand()
  })

program
  .command("paste")
  .description("Paste notes from clipboard")
  .option("--at <position>", "Position to paste at")
  .option("--merge", "Merge with existing notes")
  .action(async (options) => {
    await pasteCommand(options)
  })

// ─── Density & Voice Commands ───

program
  .command("thin")
  .description("Thin out notes by percentage or density")
  .argument("[percent]", "Keep N% of notes randomly")
  .option("--max-density <n>", "Maximum notes per grid unit")
  .option("--per <value>", "Grid unit for density (e.g., 1/4)")
  .action(async (percent, options) => {
    await thinCommand(percent, options)
  })

program
  .command("spread")
  .description("Split notes into voices by pitch")
  .option("--voices <n>", "Number of voices", "2")
  .option("--channel <channels>", "Comma-separated channel assignments")
  .action(async (options) => {
    await spreadCommand(options)
  })

program
  .command("compress")
  .description("Compress velocity dynamics")
  .option("--range <min-max>", "Target velocity range (e.g., 40-100)")
  .option("--ratio <n>", "Compression ratio toward mean (e.g., 2)")
  .action(async (options) => {
    await compressCommand(options)
  })

// ─── Analysis Commands ───

program
  .command("analyze")
  .description("Identify chords from note clusters")
  .option("--key <key-scale>", "Key for Roman numeral analysis")
  .action(async (options) => {
    await analyzeCommand(options)
  })

program
  .command("voice-lead")
  .description("Smooth out chord voicings for minimal voice movement")
  .requiredOption("--key <key-scale>", "Key (e.g., c-major, d-minor)")
  .action(async (options) => {
    await voiceLeadCommand(options)
  })

// ─── Scripting Commands ───

program
  .command("let")
  .description("Set variables on the stream context")
  .argument(
    "<assignments...>",
    "Variable assignments (e.g., key=c-major tempo=120)",
  )
  .action(async (assignments) => {
    await letCommand(assignments)
  })

program
  .command("run")
  .description("Execute a script with for/if/while constructs")
  .argument("<script>", "Script to execute (use quotes)")
  .action(async (script) => {
    await runCommand(script, (command, _stream) => {
      // For the CLI, we don't have a full in-process executor
      // since each command is its own process in shell pipelines.
      // The run command is primarily for the web app's inline engine.
      throw new Error(
        `The "run" command is designed for the web app inline engine. ` +
          `For CLI usage, use shell piping instead: ${command}`,
      )
    })
  })

// ─── Sink Commands ───

program
  .command("set-notes")
  .description("Write piped notes back into a track in a MIDI file")
  .argument("<file>", "Path to MIDI file to modify")
  .option("-t, --track <number>", "Track number (1-indexed)", "1")
  .option("--from <position>", "Replace notes starting from this position")
  .option("--start <position>", "Alias for --from")
  .option("--to <position>", "Replace notes up to this position")
  .option("--end <position>", "Alias for --to")
  .option("--merge", "Merge with existing notes instead of replacing")
  .action(async (file, options) => {
    await setNotesCommand(file, {
      ...options,
      from: options.from ?? options.start,
      to: options.to ?? options.end,
    })
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
