import { BLEMIDIStreamParser } from "./BLEMIDIStreamParser"

function createDataView(bytes: number[]): DataView {
  return new DataView(Uint8Array.from(bytes).buffer)
}

// datasets from https://github.com/trueroad/BLE_MIDI_packet_data_set

describe("BLEMIDIStreamParser", () => {
  test("p3_1_BLE_Packet_with_One_MIDI_Message", () => {
    const bytes = [128, 128, 224, 0, 64]
    const callback = jest.fn()
    const parser = new BLEMIDIStreamParser(callback)
    parser.push(createDataView(bytes))
    expect(callback).toHaveBeenCalledWith({
      timestampMs: 0,
      message: new Uint8Array([0xe0, 0, 64]),
    })
  })

  test("p3_2_BLE_Packet_with_Two_MIDI_Messages", () => {
    const bytes = [128, 128, 144, 60, 100, 129, 128, 60, 90]
    const callback = jest.fn()
    const parser = new BLEMIDIStreamParser(callback)
    parser.push(createDataView(bytes))
    expect(callback).toHaveBeenNthCalledWith(1, {
      timestampMs: 0,
      message: new Uint8Array([0x90, 0x3c, 0x64]),
    })
    expect(callback).toHaveBeenNthCalledWith(2, {
      timestampMs: 1,
      message: new Uint8Array([0x80, 0x3c, 0x5a]),
    })
  })

  test("p3_3_2_MIDI_Messages_with_Running_Status", () => {
    const bytes = [128, 128, 144, 60, 100, 60, 0]
    const callback = jest.fn()
    const parser = new BLEMIDIStreamParser(callback)
    parser.push(createDataView(bytes))
    expect(callback).toHaveBeenNthCalledWith(1, {
      timestampMs: 0,
      message: new Uint8Array([0x90, 60, 100]),
    })
    expect(callback).toHaveBeenNthCalledWith(2, {
      timestampMs: 0,
      message: new Uint8Array([0x90, 60, 0]),
    })
  })

  test("p4_1_Multiple_MIDI_Message_mixed_type", () => {
    const bytes = [
      128, 128, 144, 60, 100, 129, 144, 60, 0, 61, 90, 130, 61, 0, 131, 224, 0,
      64,
    ]
    const callback = jest.fn()
    const parser = new BLEMIDIStreamParser(callback)
    parser.push(createDataView(bytes))
    expect(callback).toHaveBeenNthCalledWith(1, {
      timestampMs: 0,
      message: new Uint8Array([0x90, 60, 100]),
    })
    expect(callback).toHaveBeenNthCalledWith(2, {
      timestampMs: 1,
      message: new Uint8Array([0x90, 60, 0]),
    })
    expect(callback).toHaveBeenNthCalledWith(3, {
      timestampMs: 1,
      message: new Uint8Array([0x90, 61, 90]),
    })
    expect(callback).toHaveBeenNthCalledWith(4, {
      timestampMs: 2,
      message: new Uint8Array([0x90, 61, 0]),
    })
    expect(callback).toHaveBeenNthCalledWith(5, {
      timestampMs: 3,
      message: new Uint8Array([0xe0, 0, 64]),
    })
  })

  test("p4_2_System_Messges_Do_Not_Cancel_Running_Status", () => {
    const bytes = [128, 128, 224, 0, 0, 127, 127, 129, 254, 129, 0, 64]
    const callback = jest.fn()
    const parser = new BLEMIDIStreamParser(callback)
    parser.push(createDataView(bytes))
    expect(callback).toHaveBeenNthCalledWith(1, {
      timestampMs: 0,
      message: new Uint8Array([0xe0, 0, 0]),
    })
    expect(callback).toHaveBeenNthCalledWith(2, {
      timestampMs: 0,
      message: new Uint8Array([0xe0, 0x7f, 0x7f]),
    })
    expect(callback).toHaveBeenNthCalledWith(3, {
      timestampMs: 1,
      message: new Uint8Array([0xfe]),
    })
    expect(callback).toHaveBeenNthCalledWith(4, {
      timestampMs: 1,
      message: new Uint8Array([0xe0, 0, 64]),
    })
  })

  test("p5_1_MIDI_Stream_with_System_Real-Time_Message_in_the_middle_of_another_MIDI_Message", () => {
    const bytes = [128, 128, 224, 0, 64, 129, 254]
    const callback = jest.fn()
    const parser = new BLEMIDIStreamParser(callback)
    parser.push(createDataView(bytes))
    expect(callback).toHaveBeenNthCalledWith(1, {
      timestampMs: 0,
      message: new Uint8Array([0xe0, 0, 64]),
    })
    expect(callback).toHaveBeenNthCalledWith(2, {
      timestampMs: 1,
      message: new Uint8Array([0xfe]),
    })
  })

  test("p6_1_System_Exclusive_Start_and_End_in_1_Packet", () => {
    const bytes = [128, 128, 240, 67, 18, 0, 67, 18, 0, 67, 18, 0, 129, 247]
    const callback = jest.fn()
    const parser = new BLEMIDIStreamParser(callback)
    parser.push(createDataView(bytes))
    expect(callback).toHaveBeenCalledWith({
      timestampMs: 1, // F7のタイムスタンプ
      message: new Uint8Array([0xf0, 67, 18, 0, 67, 18, 0, 67, 18, 0, 0xf7]),
    })
  })

  test("p6_2_System_Exclusive_Split_Across_2_Packets", () => {
    const packet1 = [128, 128, 240, 67, 18, 0]
    const packet2 = [128, 67, 18, 0, 67, 18, 0, 129, 247]
    const callback = jest.fn()
    const parser = new BLEMIDIStreamParser(callback)
    parser.push(createDataView(packet1))
    parser.push(createDataView(packet2))
    expect(callback).toHaveBeenCalledWith({
      timestampMs: 1,
      message: new Uint8Array([0xf0, 67, 18, 0, 67, 18, 0, 67, 18, 0, 0xf7]),
    })
  })

  test("p6_3_System_Exclusive_Split_Across_3_Packets", () => {
    const packet1 = [128, 128, 240, 67, 18, 0]
    const packet2 = [128, 67, 18, 0]
    const packet3 = [128, 67, 18, 0, 129, 247]
    const callback = jest.fn()
    const parser = new BLEMIDIStreamParser(callback)
    parser.push(createDataView(packet1))
    parser.push(createDataView(packet2))
    parser.push(createDataView(packet3))
    expect(callback).toHaveBeenCalledWith({
      timestampMs: 1,
      message: new Uint8Array([0xf0, 67, 18, 0, 67, 18, 0, 67, 18, 0, 0xf7]),
    })
  })

  // According to BLE MIDI spec: Real-time messages should be sent separately
  // while SysEx data is preserved and sent as one complete message
  test("p6_e1_System_Exclusive_Start_and_End_in_1_Packet_with_System_Real-time", () => {
    const bytes = [
      128, 128, 240, 67, 18, 0, 129, 254, 67, 18, 0, 67, 18, 0, 130, 247,
    ]
    const callback = jest.fn()
    const parser = new BLEMIDIStreamParser(callback)
    parser.push(createDataView(bytes))

    // Real-time message is sent separately
    expect(callback).toHaveBeenNthCalledWith(1, {
      timestampMs: 1,
      message: new Uint8Array([0xfe]),
    })

    // Complete SysEx message with all data preserved at F7 timestamp
    expect(callback).toHaveBeenNthCalledWith(2, {
      timestampMs: 2,
      message: new Uint8Array([0xf0, 67, 18, 0, 67, 18, 0, 67, 18, 0, 0xf7]),
    })
  })

  test("p6_e2_System_Exclusive_Split_Across_1_Packets_with_System_Real-time", () => {
    const packet1 = [128, 128, 240, 67, 129, 254, 18, 0]
    const packet2 = [128, 67, 18, 0, 130, 254, 67, 18, 0, 131, 247]
    const callback = jest.fn()
    const parser = new BLEMIDIStreamParser(callback)
    parser.push(createDataView(packet1))
    parser.push(createDataView(packet2))

    // Real-time messages are sent separately
    expect(callback).toHaveBeenNthCalledWith(1, {
      timestampMs: 1,
      message: new Uint8Array([0xfe]),
    })
    expect(callback).toHaveBeenNthCalledWith(2, {
      timestampMs: 2,
      message: new Uint8Array([0xfe]),
    })

    // Complete SysEx message with all data preserved
    expect(callback).toHaveBeenNthCalledWith(3, {
      timestampMs: 3,
      message: new Uint8Array([0xf0, 67, 18, 0, 67, 18, 0, 67, 18, 0, 0xf7]),
    })
  })

  test("p6_e3_System_Exclusive_Split_Across_3_Packets_with_System_Real-time", () => {
    const packet1 = [128, 128, 240, 67, 129, 254, 18, 0]
    const packet2 = [128, 67, 18, 130, 254, 0]
    const packet3 = [128, 67, 131, 254, 18, 0, 132, 247]
    const callback = jest.fn()
    const parser = new BLEMIDIStreamParser(callback)
    parser.push(createDataView(packet1))
    parser.push(createDataView(packet2))
    parser.push(createDataView(packet3))

    // Real-time messages are sent separately
    expect(callback).toHaveBeenNthCalledWith(1, {
      timestampMs: 1,
      message: new Uint8Array([0xfe]),
    })
    expect(callback).toHaveBeenNthCalledWith(2, {
      timestampMs: 2,
      message: new Uint8Array([0xfe]),
    })
    expect(callback).toHaveBeenNthCalledWith(3, {
      timestampMs: 3,
      message: new Uint8Array([0xfe]),
    })

    // Complete SysEx message with all data preserved
    expect(callback).toHaveBeenNthCalledWith(4, {
      timestampMs: 4,
      message: new Uint8Array([0xf0, 67, 18, 0, 67, 18, 0, 67, 18, 0, 0xf7]),
    })
  })

  test("overflow", () => {
    const bytes = [
      0b10001000, // Header: timestampHigh = 8
      0b10000100, // TimestampLow = 4
      0x90,
      0x3c,
      0x7f, // Note On (C4, velocity 127)

      0b10000010, // TimestampLow = 2 ← 小さくなっている → overflow
      0x80,
      0x3c,
      0x00, // Note Off (C4)
    ]
    const callback = jest.fn()
    const parser = new BLEMIDIStreamParser(callback)
    parser.push(createDataView(bytes))
    expect(callback).toHaveBeenNthCalledWith(1, {
      timestampMs: (8 << 7) | 4, // 8 * 128 + 4 = 1028
      message: new Uint8Array([0x90, 0x3c, 0x7f]),
    })
    expect(callback).toHaveBeenNthCalledWith(2, {
      timestampMs: ((8 + 1) << 7) | 2, // 9 * 128 + 2 = 1154
      message: new Uint8Array([0x80, 0x3c, 0x00]),
    })
  })
})
