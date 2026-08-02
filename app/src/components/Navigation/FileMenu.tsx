import { MenuHotKey as HotKey, MenuDivider, MenuItem } from "@signal-app/ui"
import { FC } from "react"
import { useSong } from "../../hooks/useSong"
import { useSongFile } from "../../hooks/useSongFile"
import { envString } from "../../localize/envString"
import { Localized } from "../../localize/useLocalization"

export const FileMenu: FC = () => {
  const { fileHandle } = useSong()
  const { createNewSong, openSong, saveSong, saveAsSong, downloadSong } =
    useSongFile()

  return (
    <>
      <MenuItem onClick={createNewSong}>
        <Localized name="new-song" />
        <HotKey>{envString.altOrOption}+N</HotKey>
      </MenuItem>

      <MenuDivider />

      <MenuItem onClick={openSong}>
        <Localized name="open-song" />
        <HotKey>{envString.cmdOrCtrl}+O</HotKey>
      </MenuItem>

      <MenuItem onClick={saveSong} disabled={fileHandle === null}>
        <Localized name="save-song" />
        <HotKey>{envString.cmdOrCtrl}+S</HotKey>
      </MenuItem>

      <MenuItem onClick={saveAsSong}>
        <Localized name="save-as" />
        <HotKey>{envString.cmdOrCtrl}+Shift+S</HotKey>
      </MenuItem>

      <MenuItem onClick={downloadSong}>
        <Localized name="download-midi" />
      </MenuItem>
    </>
  )
}
