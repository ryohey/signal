import { MenuDivider, MenuItem } from "@signal-app/ui"
import { FC } from "react"
import { hasFSAccess } from "../../actions/file"
import { useCloudFile } from "../../features/cloud-file/hooks/useCloudFile"
import { useSong } from "../../hooks/useSong"
import { Localized } from "../../localize/useLocalization"
import { FileInput } from "./LegacyFileMenu"

export const CloudFileMenu: FC = () => {
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

  return (
    <>
      <MenuItem onClick={createNewSong}>
        <Localized name="new-song" />
      </MenuItem>

      <MenuDivider />

      <MenuItem onClick={openSong}>
        <Localized name="open-song" />
      </MenuItem>

      <MenuItem onClick={saveSong} disabled={isSaved}>
        <Localized name="save-song" />
      </MenuItem>

      <MenuItem onClick={saveAsSong} disabled={!isCloudSaved}>
        <Localized name="save-as" />
      </MenuItem>

      <MenuItem onClick={renameSong} disabled={!isCloudSaved}>
        <Localized name="rename" />
      </MenuItem>

      <MenuDivider />

      {!hasFSAccess && (
        <FileInput onChange={importSongLegacy}>
          <MenuItem>
            <Localized name="import-midi" />
          </MenuItem>
        </FileInput>
      )}

      {hasFSAccess && (
        <MenuItem onClick={importSong}>
          <Localized name="import-midi" />
        </MenuItem>
      )}

      <MenuItem onClick={exportSong}>
        <Localized name="export-midi" />
      </MenuItem>

      <MenuDivider />

      <MenuItem onClick={publishSong} disabled={!isCloudSaved}>
        <Localized name="publish" />
      </MenuItem>
    </>
  )
}
