import { songToMidi } from "@signal-app/core"
import { FC } from "react"
import {
  useDeleteSelection,
  useDuplicateSelection,
  useQuantizeSelectedNotes,
  useSelectAllNotes,
  useSelectNextNote,
  useSelectPreviousNote,
  useSetSong,
  useTransposeSelection,
} from "../../actions"
import { songFromArrayBuffer } from "../../actions/file"
import {
  useCopySelectionGlobal,
  useCutSelectionGlobal,
  usePasteSelectionGlobal,
} from "../../actions/hotkey"
import { useExport } from "../../hooks/useExport"
import { useHistory } from "../../hooks/useHistory"
import { usePianoRoll } from "../../hooks/usePianoRoll"
import { useRootView } from "../../hooks/useRootView"
import { useSong } from "../../hooks/useSong"
import { useSongFile } from "../../hooks/useSongFile"
import { useLocalization } from "../../localize/useLocalization"
import { ElectronCallback } from "./ElectronCallback"

export const ElectronCallbackHandler: FC = () => {
  const { isSaved, filepath, getSong, setSaved, setFilepath } = useSong()
  const { setOpenSettingDialog, setOpenHelpDialog } = useRootView()
  const { setOpenTransposeDialog, setOpenVelocityDialog } = usePianoRoll()
  const localized = useLocalization()
  const localSongFile = useSongFile()
  const cutSelectionGlobal = useCutSelectionGlobal()
  const copySelectionGlobal = useCopySelectionGlobal()
  const pasteSelectionGlobal = usePasteSelectionGlobal()
  const deleteSelection = useDeleteSelection()
  const duplicateSelection = useDuplicateSelection()
  const selectAllNotes = useSelectAllNotes()
  const selectNextNote = useSelectNextNote()
  const selectPreviousNote = useSelectPreviousNote()
  const quantizeSelectedNotes = useQuantizeSelectedNotes()
  const transposeSelection = useTransposeSelection()
  const { undo, redo } = useHistory()
  const setSong = useSetSong()
  const { exportSong } = useExport()

  const saveFileAs = async () => {
    try {
      const res = await window.electronAPI.showSaveDialog()
      if (res === null) {
        return // canceled
      }
      const { path } = res
      const data = songToMidi(getSong()).buffer as ArrayBuffer
      setFilepath(path)
      setSaved(true)
      await window.electronAPI.saveFile(path, data)
      window.electronAPI.addRecentDocument(path)
    } catch (e) {
      alert((e as Error).message)
    }
  }

  return (
    <ElectronCallback
      onNewFile={async () => {
        await localSongFile.createNewSong()
      }}
      onClickOpenFile={async () => {
        try {
          if (isSaved || confirm(localized["confirm-open"])) {
            const res = await window.electronAPI.showOpenDialog()
            if (res === null) {
              return // canceled
            }
            const { path, content } = res
            const song = songFromArrayBuffer(content, path)
            setSong(song)
            window.electronAPI.addRecentDocument(path)
          }
        } catch (e) {
          alert((e as Error).message)
        }
      }}
      onOpenFile={async ({ filePath }) => {
        try {
          if (isSaved || confirm(localized["confirm-open"])) {
            const data = await window.electronAPI.readFile(filePath)
            const song = songFromArrayBuffer(data, filePath)
            setSong(song)
            window.electronAPI.addRecentDocument(filePath)
          }
        } catch (e) {
          alert((e as Error).message)
        }
      }}
      onSaveFile={async () => {
        try {
          if (filepath) {
            const data = songToMidi(getSong()).buffer as ArrayBuffer
            await window.electronAPI.saveFile(filepath, data)
            setSaved(true)
          } else {
            await saveFileAs()
          }
        } catch (e) {
          alert((e as Error).message)
        }
      }}
      onSaveFileAs={saveFileAs}
      onRename={async () => {}}
      onImport={async () => {}}
      onExportWav={() => {
        exportSong("WAV")
      }}
      onExportMp3={() => {
        exportSong("MP3")
      }}
      onUndo={undo}
      onRedo={redo}
      onCut={cutSelectionGlobal}
      onCopy={copySelectionGlobal}
      onPaste={pasteSelectionGlobal}
      onDuplicate={duplicateSelection}
      onDelete={deleteSelection}
      onSelectAll={selectAllNotes}
      onSelectNextNote={selectNextNote}
      onSelectPreviousNote={selectPreviousNote}
      onTransposeUpOctave={() => transposeSelection(12)}
      onTransposeDownOctave={() => transposeSelection(-12)}
      onTranspose={() => {
        setOpenTransposeDialog(true)
      }}
      onQuantize={quantizeSelectedNotes}
      onVelocity={() => {
        setOpenVelocityDialog(true)
      }}
      onOpenSetting={() => {
        setOpenSettingDialog(true)
      }}
      onOpenHelp={() => {
        setOpenHelpDialog(true)
      }}
    />
  )
}
