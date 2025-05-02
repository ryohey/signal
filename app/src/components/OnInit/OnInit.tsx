import { useProgress } from "dialog-hooks"
import { FC, useEffect, useState } from "react"
import { useSetSong } from "../../actions"
import { useLoadSongFromExternalMidiFile } from "../../actions/cloudSong"
import { songFromArrayBuffer } from "../../actions/file"
import { isRunningInElectron } from "../../helpers/platform"
import { useStores } from "../../hooks/useStores"
import { useLocalization } from "../../localize/useLocalization"
import { InitializeErrorDialog } from "./InitializeErrorDialog"

export const OnInit: FC = () => {
  const rootStore = useStores()
  const setSong = useSetSong()
  const loadSongFromExternalMidiFile = useLoadSongFromExternalMidiFile()

  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const { show: showProgress } = useProgress()
  const localized = useLocalization()

  const init = async () => {
    const closeProgress = showProgress(localized["initializing"])
    try {
      await rootStore.init()
    } catch (e) {
      setIsErrorDialogOpen(true)
      setErrorMessage((e as Error).message)
    } finally {
      closeProgress()
    }
  }

  const loadExternalMidiIfNeeded = async () => {
    const params = new URLSearchParams(window.location.search)
    const openParam = params.get("open")

    if (openParam) {
      const closeProgress = showProgress(localized["loading-external-midi"])
      try {
        const song = await loadSongFromExternalMidiFile(openParam)
        setSong(song)
      } catch (e) {
        setIsErrorDialogOpen(true)
        setErrorMessage((e as Error).message)
      } finally {
        closeProgress()
      }
    }
  }

  const loadArgumentFileIfNeeded = async () => {
    if (!isRunningInElectron()) {
      return
    }
    const closeProgress = showProgress(localized["loading-file"])
    try {
      const filePath = await window.electronAPI.getArgument()
      if (filePath) {
        const data = await window.electronAPI.readFile(filePath)
        const song = songFromArrayBuffer(data, filePath)
        setSong(song)
      }
    } catch (e) {
      setIsErrorDialogOpen(true)
      setErrorMessage((e as Error).message)
    } finally {
      closeProgress()
    }
  }

  useEffect(() => {
    ;(async () => {
      await init()
      await loadExternalMidiIfNeeded()
      await loadArgumentFileIfNeeded()
    })()
  }, [])

  return (
    <>
      <InitializeErrorDialog
        open={isErrorDialogOpen}
        message={errorMessage}
        onClose={() => setIsErrorDialogOpen(false)}
      />
    </>
  )
}
