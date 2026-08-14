import { readFile, unlink } from "node:fs/promises"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { expect, test } from "vitest"

const toolValue = (response: Awaited<ReturnType<Client["callTool"]>>) => {
  const value = response as {
    structuredContent?: unknown
    content: Array<{ type: string; text?: string }>
  }
  return value.structuredContent ?? JSON.parse(value.content[0].text ?? "null")
}

test("serves tools over MCP stdio and exports MP3", async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [resolve(process.cwd(), "dist/server.mjs")],
  })
  const client = new Client({ name: "signal-headless-test", version: "0.1.0" })
  const outputPath = resolve(tmpdir(), `signal-headless-mcp-${process.pid}.mp3`)

  try {
    await client.connect(transport)
    const tools = await client.listTools()
    expect(tools.tools).toHaveLength(11)

    await client.callTool({
      name: "signal_new_project",
      arguments: { name: "MCP transport test" },
    })
    const state = toolValue(
      await client.callTool({ name: "signal_get_project", arguments: {} }),
    )
    const trackId = state.tracks.find(
      (track: { isConductor: boolean }) => !track.isConductor,
    )?.id
    expect(trackId).toBeTypeOf("number")

    await client.callTool({
      name: "signal_add_notes",
      arguments: {
        trackId,
        notes: [{ tick: 0, duration: 480, noteNumber: 60, velocity: 100 }],
      },
    })
    const rendered = toolValue(
      await client.callTool({
        name: "signal_export_audio",
        arguments: {
          filePath: outputPath,
          format: "mp3",
          durationSeconds: 1,
          sampleRate: 22050,
          bitrateKbps: 96,
        },
      }),
    )
    expect(rendered.byteLength).toBeGreaterThan(1000)
    expect((await readFile(outputPath)).byteLength).toBe(rendered.byteLength)
  } finally {
    await client.close()
    await unlink(outputPath).catch(() => undefined)
  }
}, 30_000)
