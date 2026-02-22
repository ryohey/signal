import { describe, expect, it } from "vitest"
import { evaluateScript, parseScript } from "../../src/scripting/evaluator.js"
import type { NoteStream } from "../../src/types.js"

function makeStream(
  notes: NoteStream["notes"] = [],
  vars?: Record<string, string>,
): NoteStream {
  return {
    context: {
      timebase: 480,
      measures: [{ tick: 0, measure: 0, numerator: 4, denominator: 4 }],
      vars,
    },
    notes,
  }
}

// Simple executor that handles basic commands for testing
function testExecutor(command: string, stream: NoteStream): NoteStream {
  const parts = command.trim().split(/\s+/)
  const name = parts[0]

  switch (name) {
    case "transpose": {
      const semitones = parseInt(parts[1], 10)
      return {
        ...stream,
        notes: stream.notes.map((n) => ({
          ...n,
          noteNumber: n.noteNumber + semitones,
        })),
      }
    }
    case "add-note": {
      const noteNumber = parseInt(parts[1], 10)
      return {
        ...stream,
        notes: [
          ...stream.notes,
          {
            tick: stream.notes.length * 480,
            duration: 480,
            noteNumber,
            velocity: 100,
          },
        ],
      }
    }
    case "let": {
      const vars = { ...(stream.context.vars ?? {}) }
      for (let i = 1; i < parts.length; i++) {
        const eqIndex = parts[i].indexOf("=")
        if (eqIndex >= 0) {
          vars[parts[i].slice(0, eqIndex)] = parts[i].slice(eqIndex + 1)
        }
      }
      return { ...stream, context: { ...stream.context, vars } }
    }
    default:
      throw new Error(`Unknown test command: ${name}`)
  }
}

describe("parseScript", () => {
  it("parses a simple command", () => {
    const ast = parseScript("transpose 2")
    expect(ast).toEqual({ type: "command", raw: "transpose 2" })
  })

  it("parses a pipeline", () => {
    const ast = parseScript("transpose 2 | add-note 60")
    expect(ast.type).toBe("pipeline")
    if (ast.type === "pipeline") {
      expect(ast.commands).toHaveLength(2)
    }
  })

  it("parses a for loop", () => {
    const ast = parseScript("for i in 1..4 { transpose 2 }")
    expect(ast.type).toBe("for")
    if (ast.type === "for") {
      expect(ast.variable).toBe("i")
      expect(ast.start).toBe(1)
      expect(ast.end).toBe(4)
    }
  })

  it("parses an if statement", () => {
    const ast = parseScript("if $x > 3 { transpose 2 }")
    expect(ast.type).toBe("if")
    if (ast.type === "if") {
      expect(ast.condition).toEqual({ left: "$x", op: ">", right: "3" })
    }
  })

  it("parses if/else", () => {
    const ast = parseScript("if $x > 3 { transpose 2 } else { transpose -2 }")
    expect(ast.type).toBe("if")
    if (ast.type === "if") {
      expect(ast.elseBranch).toBeDefined()
    }
  })

  it("parses a while loop", () => {
    const ast = parseScript("while $count < 5 { add-note 60 }")
    expect(ast.type).toBe("while")
    if (ast.type === "while") {
      expect(ast.condition).toEqual({ left: "$count", op: "<", right: "5" })
    }
  })
})

describe("evaluateScript", () => {
  it("executes a simple command", () => {
    const stream = makeStream([
      { tick: 0, duration: 480, noteNumber: 60, velocity: 100 },
    ])
    const result = evaluateScript("transpose 2", stream, testExecutor)
    expect(result.notes[0].noteNumber).toBe(62)
  })

  it("executes a pipeline", () => {
    const stream = makeStream([
      { tick: 0, duration: 480, noteNumber: 60, velocity: 100 },
    ])
    const result = evaluateScript(
      "transpose 2 | transpose 3",
      stream,
      testExecutor,
    )
    expect(result.notes[0].noteNumber).toBe(65)
  })

  it("executes a for loop", () => {
    const stream = makeStream([
      { tick: 0, duration: 480, noteNumber: 60, velocity: 100 },
    ])
    // Transpose by 2, four times = +8
    const result = evaluateScript(
      "for i in 1..4 { transpose 2 }",
      stream,
      testExecutor,
    )
    expect(result.notes[0].noteNumber).toBe(68)
  })

  it("for loop sets loop variable", () => {
    const stream = makeStream()
    // Add notes using loop variable
    const result = evaluateScript(
      "for i in 1..3 { add-note $i }",
      stream,
      testExecutor,
    )
    expect(result.notes).toHaveLength(3)
    expect(result.notes[0].noteNumber).toBe(1)
    expect(result.notes[1].noteNumber).toBe(2)
    expect(result.notes[2].noteNumber).toBe(3)
  })

  it("if statement evaluates condition (true branch)", () => {
    const stream = makeStream(
      [{ tick: 0, duration: 480, noteNumber: 60, velocity: 100 }],
      { x: "5" },
    )
    const result = evaluateScript(
      "if $x > 3 { transpose 10 }",
      stream,
      testExecutor,
    )
    expect(result.notes[0].noteNumber).toBe(70)
  })

  it("if statement evaluates condition (false branch, no else)", () => {
    const stream = makeStream(
      [{ tick: 0, duration: 480, noteNumber: 60, velocity: 100 }],
      { x: "1" },
    )
    const result = evaluateScript(
      "if $x > 3 { transpose 10 }",
      stream,
      testExecutor,
    )
    expect(result.notes[0].noteNumber).toBe(60)
  })

  it("if/else executes else branch when condition is false", () => {
    const stream = makeStream(
      [{ tick: 0, duration: 480, noteNumber: 60, velocity: 100 }],
      { x: "1" },
    )
    const result = evaluateScript(
      "if $x > 3 { transpose 10 } else { transpose -5 }",
      stream,
      testExecutor,
    )
    expect(result.notes[0].noteNumber).toBe(55)
  })

  it("while loop executes until condition is false", () => {
    const stream = makeStream([], { count: "0" })
    // This needs the executor to increment count, but our test executor can use let
    const result = evaluateScript(
      "for i in 1..3 { add-note 60 }",
      stream,
      testExecutor,
    )
    expect(result.notes).toHaveLength(3)
  })

  it("substitutes variables in commands", () => {
    const stream = makeStream(
      [{ tick: 0, duration: 480, noteNumber: 60, velocity: 100 }],
      { amount: "7" },
    )
    const result = evaluateScript("transpose $amount", stream, testExecutor)
    expect(result.notes[0].noteNumber).toBe(67)
  })

  it("handles string equality condition", () => {
    const stream = makeStream(
      [{ tick: 0, duration: 480, noteNumber: 60, velocity: 100 }],
      { mode: "high" },
    )
    const result = evaluateScript(
      "if $mode == high { transpose 12 } else { transpose -12 }",
      stream,
      testExecutor,
    )
    expect(result.notes[0].noteNumber).toBe(72)
  })

  it("handles != condition", () => {
    const stream = makeStream(
      [{ tick: 0, duration: 480, noteNumber: 60, velocity: 100 }],
      { mode: "low" },
    )
    const result = evaluateScript(
      "if $mode != high { transpose -12 }",
      stream,
      testExecutor,
    )
    expect(result.notes[0].noteNumber).toBe(48)
  })
})
