import { songToMidi } from "@signal-app/core"
import { useToast } from "dialog-hooks"
import {
  GithubAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
} from "firebase/auth"
import type { FC } from "react"
import type { FirebaseCredential } from "../../../../electron/src/FirebaseCredential"
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
import { auth } from "../.././firebase/firebase"
import { useAuth } from "../../hooks/useAuth"
import { useCloudFile } from "../../hooks/useCloudFile"
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
  const { isLoggedIn } = useAuth()
  const { setOpenSettingDialog, setOpenHelpDialog } = useRootView()
  const { setOpenTransposeDialog, setOpenVelocityDialog } = usePianoRoll()
  const localized = useLocalization()
  const localSongFile = useSongFile()
  const cloudSongFile = useCloudFile()
  const toast = useToast()
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
        if (isLoggedIn) {
          await cloudSongFile.createNewSong()
        } else {
          await localSongFile.createNewSong()
        }
      }}
      onClickOpenFile={async () => {
        if (isLoggedIn) {
          await cloudSongFile.openSong()
        } else {
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
        if (isLoggedIn) {
          await cloudSongFile.saveSong()
        } else {
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
        }
      }}
      onSaveFileAs={async () => {
        if (isLoggedIn) {
          await cloudSongFile.saveAsSong()
        } else {
          await saveFileAs()
        }
      }}
      onRename={async () => {
        await cloudSongFile.renameSong()
      }}
      onImport={async () => {
        await cloudSongFile.importSong()
      }}
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
      onBrowserSignInCompleted={async ({ credential: credentialJSON }) => {
        const credential = createCredential(credentialJSON)
        try {
          await signInWithCredential(auth, credential)
        } catch {
          toast.error("Failed to sign in")
        }
      }}
    />
  )
}

function createCredential(credential: FirebaseCredential) {
  switch (credential.providerId) {
    case "google.com":
      return GoogleAuthProvider.credential(
        credential.idToken,
        credential.accessToken
      )
    case "github.com":
      return GithubAuthProvider.credential(credential.accessToken)
    case "apple.com": {
      const provider = new OAuthProvider("apple.com")
      return provider.credential({
        idToken: credential.idToken,
        accessToken: credential.accessToken,
      })
    }
    default:
      throw new Error("Invalid provider")
  }
}
