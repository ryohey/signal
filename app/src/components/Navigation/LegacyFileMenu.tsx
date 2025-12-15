import { ChangeEvent, FC } from "react"
import { useAudioImport } from "../../providers/AudioImportProvider"
import { useSongFile } from "../../hooks/useSongFile"
import { Localized } from "../../localize/useLocalization"
import { MenuDivider, MenuItem } from "../ui/Menu"

export const fileInputID = "OpenButtonInputFile"
const audioInputID = "AudioImportInputFile"

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

export const LegacyFileMenu: FC<{ close: () => void }> = ({ close }) => {
  const { createNewSong, openSongLegacy, downloadSong } = useSongFile()
  const { openAudioImportDialog } = useAudioImport()

  const onClickNew = async () => {
    close()
    await createNewSong()
  }

  const onClickOpen = async (e: ChangeEvent<HTMLInputElement>) => {
    close()
    await openSongLegacy(e)
  }

  const onClickImportAudio = async (e: ChangeEvent<HTMLInputElement>) => {
    close()
    const file = e.target.files?.[0]
    if (file) {
      openAudioImportDialog(file)
    }
  }

  const onClickSave = async () => {
    close()
    await downloadSong()
  }

  return (
    <>
      <MenuItem onClick={onClickNew}>
        <Localized name="new-song" />
      </MenuItem>

      <MenuDivider />

      <FileInput onChange={onClickOpen} accept=".mid,audio/midi">
        <MenuItem>
          <Localized name="open-song" />
        </MenuItem>
      </FileInput>

      <FileInput
        onChange={onClickImportAudio}
        accept="audio/mpeg,audio/wav,audio/ogg,audio/flac"
        id={audioInputID}
      >
        <MenuItem>
          <Localized name="import-audio" />
        </MenuItem>
      </FileInput>

      <MenuItem onClick={onClickSave}>
        <Localized name="save-song" />
      </MenuItem>
    </>
  )
}
