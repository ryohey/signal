import styled from "@emotion/styled"
import type { NoteEvent, TrackEvent } from "@signal-app/core"
import { isNoteEvent } from "@signal-app/core"
import { FC, useCallback, useEffect, useRef, useState } from "react"
import { useHistory } from "../../hooks/useHistory"
import { usePianoRoll } from "../../hooks/usePianoRoll"
import { useRootView } from "../../hooks/useRootView"
import { useSong } from "../../hooks/useSong"
import { useStores } from "../../hooks/useStores"
import { Dialog } from "../Dialog/Dialog"
import { buildNoteStream, executeCommand } from "./midiCommands"

let nextEntryId = 0

interface HistoryEntry {
  id: number
  type: "input" | "output" | "error"
  text: string
}

function entry(type: HistoryEntry["type"], text: string): HistoryEntry {
  return { id: nextEntryId++, type, text }
}

const TerminalContainer = styled.div`
  width: 36rem;
  height: 24rem;
  display: flex;
  flex-direction: column;
  background: #1a1a2e;
  border-radius: 0.25rem;
  overflow: hidden;
  font-family: "SF Mono", "Fira Code", "Cascadia Code", Menlo, Consolas,
    monospace;
  font-size: 0.8rem;
  line-height: 1.5;
`

const TerminalHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 0.4rem 0.75rem;
  background: #16213e;
  color: #8892b0;
  font-size: 0.7rem;
  user-select: none;
`

const TerminalOutput = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0.75rem;
  color: #ccd6f6;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #233554;
    border-radius: 3px;
  }
`

const OutputLine = styled.div<{ lineType: "input" | "output" | "error" }>`
  white-space: pre-wrap;
  word-break: break-word;
  color: ${({ lineType }) =>
    lineType === "input"
      ? "#64ffda"
      : lineType === "error"
        ? "#ff6b6b"
        : "#8892b0"};
  margin-bottom: 0.15rem;
`

const InputRow = styled.div`
  display: flex;
  align-items: center;
  padding: 0.4rem 0.75rem;
  background: #0f0f23;
  border-top: 1px solid #233554;
`

const Prompt = styled.span`
  color: #64ffda;
  margin-right: 0.5rem;
  user-select: none;
`

const Input = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  color: #ccd6f6;
  font-family: inherit;
  font-size: inherit;
  outline: none;
  caret-color: #64ffda;

  &::placeholder {
    color: #495670;
  }
`

export const MidiCliDialog: FC = () => {
  const { openMidiCliDialog, setOpenMidiCliDialog } = useRootView()
  const { selectedTrack, selectedNoteIds } = usePianoRoll()
  const { songStore } = useStores()
  const { timebase } = useSong()
  const { pushHistory } = useHistory()

  const [history, setHistory] = useState<HistoryEntry[]>([
    entry(
      "output",
      'signal-midi: MIDI CLI for the current track. Type "help" for commands.',
    ),
  ])
  const [inputValue, setInputValue] = useState("")
  const [cmdHistory, setCmdHistory] = useState<string[]>([])
  const [cmdHistoryIndex, setCmdHistoryIndex] = useState(-1)

  const outputRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    if (openMidiCliDialog && inputRef.current) {
      inputRef.current.focus()
    }
  }, [openMidiCliDialog])

  const handleSubmit = useCallback(() => {
    const cmd = inputValue.trim()
    if (!cmd) return

    setHistory((h) => [...h, entry("input", `> ${cmd}`)])
    setCmdHistory((h) => [...h, cmd])
    setCmdHistoryIndex(-1)
    setInputValue("")

    if (cmd === "clear") {
      setHistory([])
      return
    }

    if (!selectedTrack) {
      setHistory((h) => [...h, entry("error", "No track selected")])
      return
    }

    try {
      const song = songStore.song
      const hasSelection = selectedNoteIds.length > 0
      const trackStream = buildNoteStream(
        selectedTrack,
        song.conductorTrack,
        timebase,
        hasSelection ? selectedNoteIds : undefined,
      )
      const result = executeCommand(cmd, trackStream)

      if (result.message) {
        setHistory((h) => [...h, entry("output", result.message)])
      }

      // If the command is "help", don't modify the track
      if (cmd.trim() === "help") return

      // Apply the changes back to the track
      pushHistory()

      // Only remove the notes that were part of the input set
      const inputNoteIds = hasSelection
        ? selectedNoteIds
        : selectedTrack.events.filter(isNoteEvent).map((e: NoteEvent) => e.id)

      selectedTrack.removeEvents(inputNoteIds)

      // Add the transformed notes back
      const newNotes = result.stream.notes.map((note) => ({
        type: "channel" as const,
        subtype: "note" as const,
        tick: note.tick,
        duration: note.duration,
        noteNumber: note.noteNumber,
        velocity: note.velocity,
      }))
      selectedTrack.addEvents(newNotes as unknown as Omit<TrackEvent, "id">[])

      const scope = hasSelection ? " (selection)" : ""
      setHistory((h) => [
        ...h,
        entry(
          "output",
          `Applied to track${scope}: ${result.stream.notes.length} notes`,
        ),
      ])
    } catch (err) {
      setHistory((h) => [
        ...h,
        entry("error", err instanceof Error ? err.message : String(err)),
      ])
    }
    requestAnimationFrame(scrollToBottom)
  }, [
    inputValue,
    selectedTrack,
    selectedNoteIds,
    songStore,
    timebase,
    pushHistory,
    scrollToBottom,
  ])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        handleSubmit()
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        if (cmdHistory.length > 0) {
          const newIndex =
            cmdHistoryIndex === -1
              ? cmdHistory.length - 1
              : Math.max(0, cmdHistoryIndex - 1)
          setCmdHistoryIndex(newIndex)
          setInputValue(cmdHistory[newIndex])
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        if (cmdHistoryIndex === -1) return
        const newIndex = cmdHistoryIndex + 1
        if (newIndex >= cmdHistory.length) {
          setCmdHistoryIndex(-1)
          setInputValue("")
        } else {
          setCmdHistoryIndex(newIndex)
          setInputValue(cmdHistory[newIndex])
        }
      }
      e.stopPropagation()
    },
    [handleSubmit, cmdHistory, cmdHistoryIndex],
  )

  const close = useCallback(
    () => setOpenMidiCliDialog(false),
    [setOpenMidiCliDialog],
  )

  const trackName = selectedTrack?.name ?? "No track"

  return (
    <Dialog
      open={openMidiCliDialog}
      onOpenChange={(open) => {
        if (!open) close()
      }}
      style={{ maxWidth: "40rem", padding: 0 }}
    >
      <TerminalContainer onClick={() => inputRef.current?.focus()}>
        <TerminalHeader>
          signal-midi — {trackName}
          {selectedNoteIds.length > 0 &&
            ` (${selectedNoteIds.length} selected)`}
        </TerminalHeader>
        <TerminalOutput ref={outputRef}>
          {history.map((e) => (
            <OutputLine key={e.id} lineType={e.type}>
              {e.text}
            </OutputLine>
          ))}
        </TerminalOutput>
        <InputRow>
          <Prompt>$</Prompt>
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            spellCheck={false}
            autoComplete="off"
          />
        </InputRow>
      </TerminalContainer>
    </Dialog>
  )
}
