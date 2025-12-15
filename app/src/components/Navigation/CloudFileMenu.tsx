import { ChangeEvent, FC } from "react"
import { hasFSAccess } from "../../actions/file"
import { useOpenAudioFile } from "../../actions/audioImport"
import { useCloudFile } from "../../hooks/useCloudFile"
import { useSong } from "../../hooks/useSong"
import { Localized } from "../../localize/useLocalization"
import { useAudioImport } from "../../providers/AudioImportProvider"
import { MenuDivider, MenuItem } from "../ui/Menu"
import { FileInput } from "./LegacyFileMenu"

export const CloudFileMenu: FC<{ close: () => void }> = ({ close }) => {
  const { cloudSongId, isSaved } = useSong()
  const isCloudSaved = cloudSongId !== null
  const {
    createNewSong,
    openSong,
    saveSong,
    saveAsSong,
    renameSong,
    importSong,
    importSongLegacy,
    exportSong,
    publishSong,
  } = useCloudFile()
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

  const onClickRename = async () => {
    close()
    await renameSong()
  }

  const onClickImportLegacy = async (e: ChangeEvent<HTMLInputElement>) => {
    close()
    await importSongLegacy(e)
  }

  const onClickImport = async () => {
    close()
    await importSong()
  }

  const onClickExport = async () => {
    close()
    await exportSong()
  }

  const onClickPublish = async () => {
    close()
    await publishSong()
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
      </MenuItem>

      <MenuDivider />

      <MenuItem onClick={onClickOpen}>
        <Localized name="open-song" />
      </MenuItem>

      <MenuItem onClick={onClickImportAudio}>
        <Localized name="import-audio" />
      </MenuItem>

      <MenuItem onClick={onClickSave} disabled={isSaved}>
        <Localized name="save-song" />
      </MenuItem>

      <MenuItem onClick={onClickSaveAs} disabled={!isCloudSaved}>
        <Localized name="save-as" />
      </MenuItem>

      <MenuItem onClick={onClickRename} disabled={!isCloudSaved}>
        <Localized name="rename" />
      </MenuItem>

      <MenuDivider />

      {!hasFSAccess && (
        <FileInput onChange={onClickImportLegacy}>
          <MenuItem>
            <Localized name="import-midi" />
          </MenuItem>
        </FileInput>
      )}

      {hasFSAccess && (
        <MenuItem onClick={onClickImport}>
          <Localized name="import-midi" />
        </MenuItem>
      )}

      <MenuItem onClick={onClickExport}>
        <Localized name="export-midi" />
      </MenuItem>

      <MenuDivider />

      <MenuItem onClick={onClickPublish} disabled={!isCloudSaved}>
        <Localized name="publish" />
      </MenuItem>
    </>
  )
}
