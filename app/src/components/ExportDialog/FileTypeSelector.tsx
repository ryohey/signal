import styled from "@emotion/styled"
import { observer } from "mobx-react-lite"
import { FC, useCallback } from "react"
import { useStores } from "../../hooks/useStores"
import { Localized } from "../../localize/useLocalization"
import { ToolbarButtonGroup, ToolbarButtonGroupItem } from "../Toolbar/ToolbarButtonGroup"

const ButtonGroup = styled(ToolbarButtonGroup)`
  background-color: transparent;
  margin: 0.65rem 0 0.65rem 0;
`

export interface FormatSelectorProps {
  formatMode: "WAV" | "MP3"
}

export const FileTypeSelector: FC = observer(() => {
  const rootStore = useStores()
  const { exportStore } = rootStore
  return (
    <div>
      <Localized name="file-type" />:

      <ButtonGroup>
        <ToolbarButtonGroupItem
          selected={exportStore.exportMode === 'WAV'}
          onMouseDown={useCallback(() => { exportStore.exportMode = "WAV" }, [exportStore])}>
          <span>WAV</span>
        </ToolbarButtonGroupItem>
        <ToolbarButtonGroupItem
          selected={exportStore.exportMode === 'MP3'}
          onMouseDown={useCallback(() => { exportStore.exportMode = "MP3" }, [exportStore])}>
          <span>MP3</span>
        </ToolbarButtonGroupItem>
      </ButtonGroup>
    </div>
  )
})