export type MidiMessage = {
  timestampMs: number
  message: Uint8Array
}

type MidiCallback = (message: MidiMessage) => void

interface SysExContext {
  timestamp: number
  partialSysExData: number[]
}

export class BLEMIDIStreamParser {
  private callback: MidiCallback
  private sysExContext: SysExContext | null = null

  constructor(callback: MidiCallback) {
    this.callback = callback
  }

  push(dataView: DataView): void {
    // BLE-MIDIパケットは [header][timestamp][data...][timestamp][data...] ... の繰り返し
    if (dataView.byteLength < 2) return
    const reader = new ByteReader(dataView)
    let node = this.sysExContext
      ? sysExHeaderNode(
          this.sysExContext.timestamp,
          this.sysExContext.partialSysExData,
        )
      : headerNode

    while (!reader.eof()) {
      const [message, nextNode] = node(reader)
      switch (message?.type) {
        case "message":
          // If we have a complete MIDI message, we call the callback
          this.callback({
            timestampMs: message.timestampMs,
            message: message.message,
          })
          // if the message is a SysEx message, we reset the SysEx buffer
          if (message.message[0] === 0xf0) {
            this.sysExContext = null
          }
          break
        case "incompleteSysEx":
          // If we have an incomplete SysEx message, we store it in the context
          this.sysExContext = {
            timestamp: message.timestamp,
            partialSysExData: message.data,
          }
          break
      }
      if (nextNode === null) {
        // If the next node is null, we have reached the end of the stream
        break
      }
      node = nextNode
    }
  }
}

class ByteReader {
  private pos: number = 0

  constructor(private readonly dataView: DataView) {}

  eof(): boolean {
    return this.pos >= this.dataView.byteLength
  }

  // Returns the byte in the current position without advancing the position
  peek(): number {
    if (this.pos >= this.dataView.byteLength) {
      throw new Error("Attempted to peek beyond the end of the DataView")
    }
    return this.dataView.getUint8(this.pos)
  }

  readByte(): number {
    const byte = this.peek()
    this.pos++
    return byte
  }

  parseHeader(): number {
    // Header
    const b = this.readByte()
    if ((b & 0xc0) !== 0x80) {
      throw new Error(
        `Invalid MIDI packet: expected header byte to start with 10, got ${b.toString(16)}`,
      )
    }
    return b & 0x3f
  }

  parseTimestamp(): number {
    // Timestamp
    const b = this.readByte()
    if ((b & 0x80) !== 0x80) {
      throw new Error(
        `Invalid MIDI packet: expected timestamp byte to start with 10, got ${b.toString(16)}`,
      )
    }
    return b & 0x7f
  }

  parseChannelMessage() {
    const firstByte = this.dataView.getUint8(this.pos)
    const length = getChannelMessageLength(firstByte)
    if (this.pos + length > this.dataView.byteLength) {
      throw new Error(
        `Invalid MIDI packet: expected ${length} bytes for channel message, but only ${this.dataView.byteLength - this.pos} bytes available`,
      )
    }
    return this.read(length)
  }

  parseSystemMessage(): Uint8Array {
    const firstByte = this.dataView.getUint8(this.pos)
    let length: number
    if ((firstByte & 0xf0) === 0xf0) {
      // System Common Message
      length = getSystemCommonLength(firstByte)
    } else {
      // System Real-Time Message
      length = 1
    }
    if (this.pos + length > this.dataView.byteLength) {
      throw new Error(
        `Invalid MIDI packet: expected ${length} bytes for system message, but only ${this.dataView.byteLength - this.pos} bytes available`,
      )
    }
    return this.read(length)
  }

  read(length: number): Uint8Array {
    if (this.pos + length > this.dataView.byteLength) {
      throw new Error(
        `Invalid read: requested ${length} bytes, but only ${this.dataView.byteLength - this.pos} bytes available`,
      )
    }
    const bytes = extractUint8Range(this.dataView, this.pos, length)
    this.pos += length
    return bytes
  }
}

function getChannelMessageLength(status: number): number {
  const messageType = (status & 0xf0) >> 4
  switch (messageType) {
    case 0x8: // Note Off
    case 0x9: // Note On
    case 0xa: // Polyphonic Key Pressure
    case 0xb: // Control Change
    case 0xe: // Pitch Bend
      return 3
    default:
      return 2
  }
}

function getSystemCommonLength(status: number): number {
  switch (status) {
    case 0xf1: // MIDI Time Code Quarter Frame
    case 0xf3: // Song Select
      return 2
    case 0xf2: // Song Position Pointer
      return 3
    case 0xf6: // Tune Request
      return 1
    default:
      return 1
  }
}

function extractUint8Range(
  view: DataView,
  start: number,
  length: number,
): Uint8Array {
  return new Uint8Array(view.buffer, view.byteOffset + start, length)
}

type ParserResult =
  | {
      type: "message"
      timestampMs: number
      message: Uint8Array
    }
  | {
      type: "incompleteSysEx"
      timestamp: number
      data: number[]
    }
  | null

type ParserNode = (reader: ByteReader) => [ParserResult, ParserNode | null]

interface RunningStatus {
  statusByte: number
  length: number
}

const headerNode: ParserNode = (reader) => {
  const timestampHigh = reader.parseHeader()
  return [null, firstTimestampNode(timestampHigh)]
}

const firstTimestampNode =
  (timestampHigh: number): ParserNode =>
  (reader) => {
    const timestampLow = reader.parseTimestamp()
    const timestamp = (timestampHigh << 7) | timestampLow
    const nextByte = reader.peek()

    // Check if the next byte is a SysEx start (0xf0)
    if (nextByte === 0xf0) {
      return [null, sysExStartNode(timestamp)]
    }
    return [null, fullMessageNode(timestamp)]
  }

const fullMessageNode =
  (timestamp: number): ParserNode =>
  (reader) => {
    const messageBody = reader.parseChannelMessage()
    const message: ParserResult = {
      type: "message",
      timestampMs: timestamp,
      message: messageBody,
    }
    if (reader.eof()) {
      // If we reach the end of the stream, we return the message and null for the next node
      return [message, null]
    }
    const runningStatus = {
      statusByte: messageBody[0],
      length: messageBody.length,
    }
    const nextByte = reader.peek()
    if ((nextByte & 0x80) === 0x80) {
      // If the next byte is a timestamp, we return the timestamp node
      return [message, timestampNode(timestamp, runningStatus)]
    } else {
      // If the next byte is not a timestamp, we assume it's a running status
      return [message, runningStatusNode(timestamp, runningStatus)]
    }
  }

const sysExHeaderNode =
  (timestamp: number, partialSysExData: number[]): ParserNode =>
  (reader) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _timestampHigh = reader.parseHeader() // ignore the header byte

    // SysEx受信中のパケットはヘッダーの直後にデータが来る
    const nextByte = reader.peek()
    if (nextByte === 0xf7) {
      return [null, sysExEndNode(timestamp, partialSysExData)]
    }
    if (nextByte & 0x80) {
      return [null, sysExSystemMessageNode(timestamp, partialSysExData)]
    }
    return [null, sysExDataNode(timestamp, partialSysExData)]
  }

const systemMessageNode =
  (timestamp: number, runningStatus: RunningStatus): ParserNode =>
  (reader) => {
    const messageBody = reader.parseSystemMessage()
    const message: ParserResult = {
      type: "message",
      timestampMs: timestamp,
      message: messageBody,
    }
    if (reader.eof()) {
      // If we reach the end of the stream, we return the message and null for the next node
      return [message, null]
    }
    // verify if the next byte is a timestamp
    const nextByte = reader.peek()
    if ((nextByte & 0x80) !== 0x80) {
      throw new Error(
        `Invalid MIDI packet: expected next byte to be a timestamp, got ${nextByte.toString(16)}`,
      )
    }
    return [message, timestampNode(timestamp, runningStatus)]
  }

const sysExDataNode =
  (timestamp: number, partialSysExData: number[]): ParserNode =>
  (reader) => {
    // 0始まりのデータが続くSysExデータを読み取る
    const sysExData: number[] = [...partialSysExData]
    while (!reader.eof()) {
      const nextByte = reader.peek()
      if ((nextByte & 0x80) === 0) {
        // If the next byte is a data byte (0-127), we read it
        sysExData.push(reader.readByte())
      } else if (nextByte === 0xf7) {
        // If the next byte is a SysEx end (0xf7), we return the SysEx data
        const message: ParserResult = {
          type: "message",
          timestampMs: timestamp,
          message: new Uint8Array([0xf0, ...sysExData, 0xf7]),
        }
        if (reader.eof()) {
          // If we reach the end of the stream, we return the message and null for the next node
          return [message, null]
        }
        return [message, firstTimestampNode(timestamp >> 7)]
      } else {
        return [null, sysExTimestampNode(timestamp >> 7, sysExData)]
      }
    }
    // eof
    return [
      {
        type: "incompleteSysEx",
        timestamp,
        data: sysExData,
      },
      null,
    ]
  }

// SysEx受信中にシステムメッセージが来た場合の処理
const sysExSystemMessageNode =
  (timestamp: number, partialSysExData: number[]): ParserNode =>
  (reader) => {
    const messageBody = reader.parseSystemMessage()
    const message: ParserResult = {
      type: "message",
      timestampMs: timestamp,
      message: messageBody,
    }
    if (reader.eof()) {
      // If we reach the end of the stream, we return the message and null for the next node
      return [message, null]
    }
    const nextByte = reader.peek()
    if ((nextByte & 0x80) === 0x80) {
      return [message, sysExTimestampNode(timestamp, partialSysExData)]
    }
    return [message, sysExDataNode(timestamp, partialSysExData)]
  }

// SysEx受信中にタイムスタンプが来た場合の処理
const sysExTimestampNode =
  (lastTimestamp: number, partialSysExData: number[]): ParserNode =>
  (reader) => {
    const timestampLow = reader.parseTimestamp()
    const timestamp = getFixedTimestamp(lastTimestamp, timestampLow)
    const nextByte = reader.peek()
    if (nextByte === 0xf7) {
      return [null, sysExEndNode(timestamp, partialSysExData)]
    }
    if (nextByte & 0x80) {
      return [null, sysExSystemMessageNode(timestamp, partialSysExData)]
    }
    return [null, sysExDataNode(timestamp, partialSysExData)]
  }

const sysExStartNode =
  (timestamp: number): ParserNode =>
  (reader) => {
    reader.readByte() // Read the SysEx start byte (0xf0)
    return [null, sysExDataNode(timestamp, [])]
  }

const sysExEndNode =
  (timestamp: number, partialSysExData: number[]): ParserNode =>
  (reader) => {
    reader.readByte() // Read the SysEx end byte (0xf7)
    // If the next byte is a SysEx end (0xf7), we return the SysEx data
    const message: ParserResult = {
      type: "message",
      timestampMs: timestamp,
      message: new Uint8Array([0xf0, ...partialSysExData, 0xf7]),
    }
    if (reader.eof()) {
      // If we reach the end of the stream, we return the message and null for the next node
      return [message, null]
    }
    return [message, firstTimestampNode(timestamp >> 7)]
  }

function getFixedTimestamp(
  lastTimestamp: number,
  timestampLow: number,
): number {
  const timestamp = (lastTimestamp & 0x70) | timestampLow
  if (timestamp < lastTimestamp) {
    // If the timestamp is less than the last timestamp, it indicates an overflow
    const timestampHigh = (lastTimestamp >> 7) + 1
    return (timestampHigh << 7) | timestampLow
  }
  return timestamp
}

const timestampNode =
  (lastTimestamp: number, runningStatus: RunningStatus): ParserNode =>
  (reader) => {
    const timestampLow = reader.parseTimestamp()
    const timestamp = getFixedTimestamp(lastTimestamp, timestampLow)
    const nextByte = reader.peek()
    if ((nextByte & 0xf0) === 0xf0) {
      // check sysex start
      if (nextByte === 0xf0) {
        return [null, sysExStartNode(timestamp)]
      } else if (nextByte === 0xf7) {
        // SysEx 受信中じゃないのに SysEx endが来た場合はエラー
        throw new Error(
          `Invalid MIDI packet: SysEx end (0xf7) received without SysEx start (0xf0)`,
        )
      } else {
        return [null, systemMessageNode(timestamp, runningStatus)]
      }
    } else if ((nextByte & 0x80) === 0x80) {
      return [null, fullMessageNode(timestamp)]
    } else {
      // If the next byte is not a timestamp, we assume it's a running status
      return [null, runningStatusNode(timestamp, runningStatus)]
    }
  }

const runningStatusNode =
  (timestamp: number, runningStatus: RunningStatus): ParserNode =>
  (reader) => {
    const messageData = reader.read(runningStatus.length - 1)
    const messageBody = new Uint8Array([
      runningStatus.statusByte,
      ...Array.from(messageData),
    ])
    const message: ParserResult = {
      type: "message",
      timestampMs: timestamp,
      message: messageBody,
    }
    if (reader.eof()) {
      // If we reach the end of the stream, we return the message and null for the next node
      return [message, null]
    }
    const nextByte = reader.peek()
    if ((nextByte & 0x80) === 0x80) {
      // If the next byte is a timestamp, we return the timestamp node
      return [message, timestampNode(timestamp, runningStatus)]
    } else {
      // If the next byte is not a timestamp, we assume it's a running status
      return [message, runningStatusNode(timestamp, runningStatus)]
    }
  }
