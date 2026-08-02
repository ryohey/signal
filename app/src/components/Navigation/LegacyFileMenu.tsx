import { MenuDivider, MenuItem } from "@signal-app/ui"
import { ChangeEvent, FC } from "react"
import { useSongFile } from "../../hooks/useSongFile"
import { Localized } from "../../localize/useLocalization"

export const fileInputID = "OpenButtonInputFile"

export const FileInput: FC<
  React.PropsWithChildren<{
    onChange: (e: ChangeEvent<HTMLInputElement>) => void
    accept?: string
    id?: string
  }>
> = ({ onChange, children, accept, id }) => (
  <>
    <input
      accept={accept}
      style={{ display: "none" }}
      id={id ?? fileInputID}
      type="file"
      onChange={onChange}
    />
    <label htmlFor={id ?? fileInputID}>{children}</label>
  </>
)

export const LegacyFileMenu: FC = () => {
  const { createNewSong, openSongLegacy, downloadSong } = useSongFile()

  return (
    <>
      <MenuItem onClick={createNewSong}>
        <Localized name="new-song" />
      </MenuItem>

      <MenuDivider />

      <FileInput onChange={openSongLegacy} accept=".mid,audio/midi">
        <MenuItem>
          <Localized name="open-song" />
        </MenuItem>
      </FileInput>

      <MenuItem onClick={downloadSong}>
        <Localized name="save-song" />
      </MenuItem>
    </>
  )
}
