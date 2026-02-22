import { hasStdinInput, readNoteStream, writeNoteStream } from "../io.js"
import type { NoteStream } from "../types.js"

// ─── AST Node Types ───

interface CommandNode {
  type: "command"
  raw: string
}

interface PipelineNode {
  type: "pipeline"
  commands: AstNode[]
}

interface ForLoopNode {
  type: "for"
  variable: string
  start: number
  end: number
  body: AstNode
}

interface IfElseNode {
  type: "if"
  condition: ConditionNode
  thenBranch: AstNode
  elseBranch?: AstNode
}

interface WhileLoopNode {
  type: "while"
  condition: ConditionNode
  body: AstNode
  maxIterations: number
}

interface ConditionNode {
  left: string
  op: string
  right: string
}

type AstNode =
  | CommandNode
  | PipelineNode
  | ForLoopNode
  | IfElseNode
  | WhileLoopNode

// ─── Tokenizer ───

interface Token {
  type: "word" | "pipe" | "lbrace" | "rbrace" | "string"
  value: string
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < input.length) {
    const ch = input[i]

    // Skip whitespace
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      i++
      continue
    }

    // Single-char tokens
    if (ch === "{") {
      tokens.push({ type: "lbrace", value: "{" })
      i++
      continue
    }
    if (ch === "}") {
      tokens.push({ type: "rbrace", value: "}" })
      i++
      continue
    }
    if (ch === "|") {
      tokens.push({ type: "pipe", value: "|" })
      i++
      continue
    }

    // Quoted string
    if (ch === '"' || ch === "'") {
      const quote = ch
      let str = ""
      i++
      while (i < input.length && input[i] !== quote) {
        if (input[i] === "\\" && i + 1 < input.length) {
          i++
          str += input[i]
        } else {
          str += input[i]
        }
        i++
      }
      if (i < input.length) i++ // skip closing quote
      tokens.push({ type: "string", value: str })
      continue
    }

    // Word (collect until whitespace or special char)
    let word = ""
    while (
      i < input.length &&
      input[i] !== " " &&
      input[i] !== "\t" &&
      input[i] !== "\n" &&
      input[i] !== "\r" &&
      input[i] !== "{" &&
      input[i] !== "}" &&
      input[i] !== "|" &&
      input[i] !== '"' &&
      input[i] !== "'"
    ) {
      word += input[i]
      i++
    }
    if (word) {
      tokens.push({ type: "word", value: word })
    }
  }

  return tokens
}

// ─── Parser ───

class Parser {
  private tokens: Token[]
  private pos: number

  constructor(tokens: Token[]) {
    this.tokens = tokens
    this.pos = 0
  }

  peek(): Token | undefined {
    return this.tokens[this.pos]
  }

  advance(): Token {
    const token = this.tokens[this.pos]
    if (!token) throw new Error("Unexpected end of script")
    this.pos++
    return token
  }

  expect(type: Token["type"], value?: string): Token {
    const token = this.advance()
    if (token.type !== type) {
      throw new Error(
        `Expected ${type}${value ? ` "${value}"` : ""}, got ${token.type} "${token.value}"`,
      )
    }
    if (value !== undefined && token.value !== value) {
      throw new Error(`Expected "${value}", got "${token.value}"`)
    }
    return token
  }

  isAtEnd(): boolean {
    return this.pos >= this.tokens.length
  }

  parse(): AstNode {
    const node = this.parsePipeline()
    return node
  }

  private parsePipeline(): AstNode {
    const first = this.parseStatement()
    const commands: AstNode[] = [first]

    while (!this.isAtEnd() && this.peek()?.type === "pipe") {
      this.advance() // consume |
      commands.push(this.parseStatement())
    }

    if (commands.length === 1) return commands[0]
    return { type: "pipeline", commands }
  }

  private parseStatement(): AstNode {
    const token = this.peek()
    if (!token) throw new Error("Unexpected end of script")

    if (token.type === "word") {
      switch (token.value) {
        case "for":
          return this.parseFor()
        case "if":
          return this.parseIf()
        case "while":
          return this.parseWhile()
      }
    }

    // Regular command — collect until pipe, rbrace, or end
    return this.parseCommand()
  }

  private parseCommand(): AstNode {
    const parts: string[] = []
    while (!this.isAtEnd()) {
      const token = this.peek()
      if (!token) break
      if (
        token.type === "pipe" ||
        token.type === "rbrace" ||
        token.type === "lbrace"
      )
        break
      if (
        token.type === "word" &&
        (token.value === "for" ||
          token.value === "if" ||
          token.value === "while" ||
          token.value === "else")
      ) {
        // These are keywords, not command parts, only break if at start
        if (parts.length === 0) break
        // Otherwise they could be arguments — but to be safe, break
        break
      }
      const t = this.advance()
      if (t.type === "string") {
        // Re-quote for downstream command parsing
        parts.push(`"${t.value}"`)
      } else {
        parts.push(t.value)
      }
    }

    if (parts.length === 0) {
      throw new Error("Expected a command")
    }

    return { type: "command", raw: parts.join(" ") }
  }

  private parseFor(): ForLoopNode {
    this.expect("word", "for")
    const varName = this.advance().value
    this.expect("word", "in")

    const rangeStr = this.advance().value
    const rangeMatch = rangeStr.match(/^(\d+)\.\.(\d+)$/)
    if (!rangeMatch) {
      throw new Error(
        `Invalid range: "${rangeStr}". Expected: start..end (e.g., 1..4)`,
      )
    }
    const start = parseInt(rangeMatch[1], 10)
    const end = parseInt(rangeMatch[2], 10)

    this.expect("lbrace")
    const body = this.parsePipeline()
    this.expect("rbrace")

    return { type: "for", variable: varName, start, end, body }
  }

  private parseIf(): IfElseNode {
    this.expect("word", "if")
    const condition = this.parseCondition()

    this.expect("lbrace")
    const thenBody = this.parsePipeline()
    this.expect("rbrace")

    let elseBody: AstNode | undefined
    if (!this.isAtEnd() && this.peek()?.value === "else") {
      this.advance() // consume 'else'
      this.expect("lbrace")
      elseBody = this.parsePipeline()
      this.expect("rbrace")
    }

    return { type: "if", condition, thenBranch: thenBody, elseBranch: elseBody }
  }

  private parseWhile(): WhileLoopNode {
    this.expect("word", "while")
    const condition = this.parseCondition()

    this.expect("lbrace")
    const body = this.parsePipeline()
    this.expect("rbrace")

    return { type: "while", condition, body, maxIterations: 1000 }
  }

  private parseCondition(): ConditionNode {
    const left = this.advance().value
    const op = this.advance().value
    const right = this.advance().value

    const validOps = [">", "<", ">=", "<=", "==", "!="]
    if (!validOps.includes(op)) {
      throw new Error(`Invalid operator: "${op}". Use: ${validOps.join(", ")}`)
    }

    return { left, op, right }
  }
}

// ─── Evaluator ───

function resolveValue(value: string, vars: Record<string, string>): string {
  return value.replace(/\$([a-zA-Z_]\w*)/g, (match, name) => {
    return vars[name] ?? match
  })
}

function evaluateCondition(
  condition: ConditionNode,
  vars: Record<string, string>,
): boolean {
  const left = resolveValue(condition.left, vars)
  const right = resolveValue(condition.right, vars)

  const leftNum = Number(left)
  const rightNum = Number(right)

  // Use numeric comparison if both are numbers
  if (!Number.isNaN(leftNum) && !Number.isNaN(rightNum)) {
    switch (condition.op) {
      case ">":
        return leftNum > rightNum
      case "<":
        return leftNum < rightNum
      case ">=":
        return leftNum >= rightNum
      case "<=":
        return leftNum <= rightNum
      case "==":
        return leftNum === rightNum
      case "!=":
        return leftNum !== rightNum
    }
  }

  // String comparison
  switch (condition.op) {
    case "==":
      return left === right
    case "!=":
      return left !== right
    case ">":
      return left > right
    case "<":
      return left < right
    case ">=":
      return left >= right
    case "<=":
      return left <= right
    default:
      return false
  }
}

export type CommandExecutor = (
  command: string,
  stream: NoteStream,
) => NoteStream

function evaluateNode(
  node: AstNode,
  stream: NoteStream,
  executor: CommandExecutor,
): NoteStream {
  switch (node.type) {
    case "command": {
      // Substitute variables before executing
      const vars = stream.context.vars ?? {}
      const resolved = resolveValue(node.raw, vars)
      return executor(resolved, stream)
    }

    case "pipeline": {
      let current = stream
      for (const cmd of node.commands) {
        current = evaluateNode(cmd, current, executor)
      }
      return current
    }

    case "for": {
      let current = stream
      for (let i = node.start; i <= node.end; i++) {
        const vars = {
          ...(current.context.vars ?? {}),
          [node.variable]: String(i),
        }
        current = {
          ...current,
          context: { ...current.context, vars },
        }
        current = evaluateNode(node.body, current, executor)
      }
      return current
    }

    case "if": {
      const vars = stream.context.vars ?? {}
      if (evaluateCondition(node.condition, vars)) {
        return evaluateNode(node.thenBranch, stream, executor)
      }
      if (node.elseBranch) {
        return evaluateNode(node.elseBranch, stream, executor)
      }
      return stream
    }

    case "while": {
      let current = stream
      let iterations = 0
      while (iterations < node.maxIterations) {
        const vars = current.context.vars ?? {}
        if (!evaluateCondition(node.condition, vars)) break
        current = evaluateNode(node.body, current, executor)
        iterations++
      }
      return current
    }
  }
}

// ─── Public API ───

export function parseScript(input: string): AstNode {
  const tokens = tokenize(input)
  if (tokens.length === 0) {
    return { type: "command", raw: "" }
  }
  const parser = new Parser(tokens)
  return parser.parse()
}

export function evaluateScript(
  script: string,
  stream: NoteStream,
  executor: CommandExecutor,
): NoteStream {
  const ast = parseScript(script)
  return evaluateNode(ast, stream, executor)
}

export async function runScriptCommand(
  script: string,
  executor: CommandExecutor,
): Promise<void> {
  let stream: NoteStream
  if (hasStdinInput()) {
    stream = await readNoteStream()
  } else {
    stream = {
      context: {
        timebase: 480,
        measures: [{ tick: 0, measure: 0, numerator: 4, denominator: 4 }],
      },
      notes: [],
    }
  }

  const result = evaluateScript(script, stream, executor)
  writeNoteStream(result)
}
