import { FC } from "react"
import { useOpenAudioFile } from "../../actions/audioImport"
import { useSong } from "../../hooks/useSong"
import { useSongFile } from "../../hooks/useSongFile"
import { envString } from "../../localize/envString"
import { Localized } from "../../localize/useLocalization"
import { useAudioImport } from "../../providers/AudioImportProvider"
import { MenuHotKey as HotKey, MenuDivider, MenuItem } from "../ui/Menu"

export const FileMenu: FC<{ close: () => void }> = ({ close }) => {
  const { fileHandle } = useSong()
  const { createNewSong, openSong, saveSong, saveAsSong, downloadSong } =
    useSongFile()
  const openAudioFile = useOpenAudioFile()
  const { openAudioImportDialog } = useAudioImport()

  const onClickNew = async () => {
    close()
    await createNewSong()
  }

  const onClickOpen = async () => {
    close()
    await openSong()
  }

  const onClickSave = async () => {
    close()
    await saveSong()
  }

  const onClickSaveAs = async () => {
    close()
    await saveAsSong()
  }

  const onClickDownload = async () => {
    close()
    await downloadSong()
  }

  const onClickImportAudio = async () => {
    close()
    const file = await openAudioFile()
    if (file) {
      openAudioImportDialog(file)
    }
  }

  return (
    <>
      <MenuItem onClick={onClickNew}>
        <Localized name="new-song" />
        <HotKey>{envString.altOrOption}+N</HotKey>
      </MenuItem>

      <MenuDivider />

      <MenuItem onClick={onClickOpen}>
        <Localized name="open-song" />
        <HotKey>{envString.cmdOrCtrl}+O</HotKey>
      </MenuItem>

      <MenuItem onClick={onClickImportAudio}>
        <Localized name="import-audio" />
      </MenuItem>

      <MenuItem onClick={onClickSave} disabled={fileHandle === null}>
        <Localized name="save-song" />
        <HotKey>{envString.cmdOrCtrl}+S</HotKey>
      </MenuItem>

      <MenuItem onClick={onClickSaveAs}>
        <Localized name="save-as" />
        <HotKey>{envString.cmdOrCtrl}+Shift+S</HotKey>
      </MenuItem>

      <MenuItem onClick={onClickDownload}>
        <Localized name="download-midi" />
      </MenuItem>
    </>
  )
}
