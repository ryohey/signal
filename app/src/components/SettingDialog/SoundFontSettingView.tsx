import styled from "@emotion/styled"
import { ChangeEvent, FC } from "react"
import { isRunningInElectron } from "../../helpers/platform"
import { useSoundFont } from "../../hooks/useSoundFont"
import { Localized } from "../../localize/useLocalization"
import { DialogContent, DialogTitle } from "../Dialog/Dialog"
import { FileInput } from "../Navigation/LegacyFileMenu"
import { Alert } from "../ui/Alert"
import { Button } from "../ui/Button"
import { SoundFontList } from "./SoundFontList"
import { SoundFontScanPathList } from "./SoundFontScanPathList"

const OpenFileButton = styled(Button)`
  display: inline-flex;
  align-items: center;
`

const SectionTitle = styled.div`
  font-weight: bold;
  margin: 1rem 0;
`

export const SoundFontSettingsView: FC = () => {
  const { addSoundFont } = useSoundFont()

  // TODO: add open local file dialog and put it to SoundFontStore
  const onOpenSoundFont = async (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    const file = e.currentTarget.files?.item(0)
    if (file) {
      const arrayBuffer = await file.arrayBuffer()
      addSoundFont({ type: "local", data: arrayBuffer }, { name: file.name })
    }
  }

  return (
    <>
      <DialogTitle>
        <Localized name="soundfont" />
      </DialogTitle>
      <DialogContent>
        <SoundFontList />
        {!isRunningInElectron() && (
          <>
            <FileInput onChange={onOpenSoundFont} accept=".sf2">
              <OpenFileButton as="div">
                <Localized name="add" />
              </OpenFileButton>
            </FileInput>
            <Alert severity="info" style={{ marginTop: "1rem" }}>
              <Localized name="soundfont-save-notice" />
            </Alert>
          </>
        )}
        {isRunningInElectron() && (
          <>
            <SectionTitle>
              <Localized name="soundfont-location" />
            </SectionTitle>
            <SoundFontScanPathList />
          </>
        )}
      </DialogContent>
    </>
  )
}
